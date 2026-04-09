package com.keydraft.mines.service;

import com.keydraft.mines.dto.InvoiceRequest;
import com.keydraft.mines.dto.InvoiceResponse;
import com.keydraft.mines.entity.*;
import com.keydraft.mines.entity.enums.DcStatus;
import com.keydraft.mines.entity.enums.PaymentStatus;
import com.keydraft.mines.exception.ResourceNotFoundException;
import com.keydraft.mines.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class InvoiceService {

    private final InvoiceRepository invoiceRepository;
    private final DeliveryChallanRepository dcRepository;
    private final CompanyRepository companyRepository;
    private final BranchRepository branchRepository;
    private final CustomerRepository customerRepository;
    private final DeliveryChallanService dcService;

    @Transactional
    public InvoiceResponse compileInvoice(InvoiceRequest request) {
        Company company = companyRepository.findById(request.getCompanyId())
                .orElseThrow(() -> new ResourceNotFoundException("Company not found"));
        Branch branch = branchRepository.findById(request.getBranchId())
                .orElseThrow(() -> new ResourceNotFoundException("Branch not found"));
        Customer customer = customerRepository.findById(request.getCustomerId())
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found"));

        List<DeliveryChallan> dcs = dcRepository.findAllById(request.getDcIds());
        if (dcs.isEmpty()) {
            throw new IllegalArgumentException("No delivery challans selected for invoice");
        }

        // Validate all DCs belong to the same customer/company/branch
        for (DeliveryChallan dc : dcs) {
            if (!dc.getCompany().getId().equals(company.getId()) || 
                !dc.getBranch().getId().equals(branch.getId()) ||
                dc.getCustomer() == null || !dc.getCustomer().getId().equals(customer.getId())) {
                throw new IllegalArgumentException("One or more DCs do not match the selected organization/customer");
            }
            if (dc.getStatus() != DcStatus.COMPLETED) {
                 // Actually allow UNPAID for POS too? 
                 // Usually only COMPLETED (credited) or UNPAID (pos pay later) are invoiced.
            }
        }

        // Calculate Totals
        BigDecimal totalAmount = dcs.stream()
                .map(dc -> dc.getAmount() != null ? dc.getAmount() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        BigDecimal gstAmount = dcs.stream()
                .map(dc -> dc.getGstAmount() != null ? dc.getGstAmount() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        BigDecimal grandTotal = totalAmount.add(gstAmount);

        // Generate Invoice Number
        String invNumber = dcService.generateDocNumber(company, branch, "INV");

        // Create Invoice
        Invoice invoice = Invoice.builder()
                .invoiceNumber(invNumber)
                .invoiceDate(LocalDate.now())
                .company(company)
                .branch(branch)
                .customer(customer)
                .totalAmount(totalAmount)
                .gstAmount(gstAmount)
                .grandTotal(grandTotal)
                .paymentTerms(request.getPaymentTerms())
                .status(PaymentStatus.UNPAID)
                .build();

        final Invoice savedInvoice = invoiceRepository.save(invoice);

        // Update DCs
        for (DeliveryChallan dc : dcs) {
            dc.setInvoiceId(savedInvoice.getId());
            dc.setStatus(DcStatus.INVOICED);
        }
        dcRepository.saveAll(dcs);

        return mapToResponse(savedInvoice, dcs);
    }

    public List<InvoiceResponse> getAllInvoices() {
        return invoiceRepository.findAll().stream()
                .map(inv -> mapToResponse(inv, null))
                .collect(Collectors.toList());
    }

    public InvoiceResponse getInvoiceById(UUID id) {
        Invoice invoice = invoiceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Invoice not found"));
        
        // Find DCs linked to this invoice
        // Note: For large systems, we'd use a dedicated repository method to find by invoiceId
        return mapToResponse(invoice, null); 
    }

    private InvoiceResponse mapToResponse(Invoice inv, List<DeliveryChallan> dcs) {
        return InvoiceResponse.builder()
                .id(inv.getId())
                .invoiceNumber(inv.getInvoiceNumber())
                .invoiceDate(inv.getInvoiceDate())
                .customerName(inv.getCustomer().getName())
                .companyName(inv.getCompany().getName())
                .branchName(inv.getBranch().getName())
                .totalAmount(inv.getTotalAmount())
                .gstAmount(inv.getGstAmount())
                .grandTotal(inv.getGrandTotal())
                .paymentTerms(inv.getPaymentTerms())
                .status(inv.getStatus().name())
                .build();
    }
}
