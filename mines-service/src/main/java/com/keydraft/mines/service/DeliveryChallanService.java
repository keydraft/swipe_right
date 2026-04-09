package com.keydraft.mines.service;

import com.keydraft.mines.dto.*;
import com.keydraft.mines.entity.*;
import com.keydraft.mines.entity.enums.*;
import com.keydraft.mines.repository.*;
import com.keydraft.mines.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.Month;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DeliveryChallanService {

    private final DeliveryChallanRepository dcRepository;
    private final SequenceNumberRepository seqRepository;
    private final CompanyRepository companyRepository;
    private final BranchRepository branchRepository;
    private final CustomerRepository customerRepository;
    private final ProductRepository productRepository;
    private final TruckRepository truckRepository;
    private final ProductPriceRepository productPriceRepository;
    private final CustomerPriceRepository customerPriceRepository;

    // ═══════════════════════════════════════════════════════════
    //  CREATE DC (Step 1: Tare entry)
    // ═══════════════════════════════════════════════════════════

    @Transactional
    public DeliveryChallanResponse createDc(DeliveryChallanRequest request) {
        Company company = companyRepository.findById(request.getCompanyId())
                .orElseThrow(() -> new RuntimeException("Company not found"));
        Branch branch = branchRepository.findById(request.getBranchId())
                .orElseThrow(() -> new RuntimeException("Branch not found"));
        Product product = productRepository.findById(request.getProductId())
                .orElseThrow(() -> new RuntimeException("Product not found"));

        CustomerType customerType = CustomerType.valueOf(request.getCustomerType().toUpperCase());
        SaleMode saleMode = SaleMode.valueOf(request.getSaleMode().toUpperCase());

        // Validate customer type vs sale mode
        validateCustomerSaleMode(customerType, saleMode);

        // Resolve customer
        Customer customer = null;
        if (customerType != CustomerType.GUEST) {
            customer = customerRepository.findById(request.getCustomerId())
                    .orElseThrow(() -> new RuntimeException("Customer not found"));
        }

        // Resolve truck (optional)
        Truck truck = null;
        if (request.getTruckId() != null) {
            truck = truckRepository.findById(request.getTruckId()).orElse(null);
        }

        // Resolve rate
        BigDecimal rate = resolveRate(customerType, saleMode, customer, product, branch);

        // Generate DC number
        String dcNumber = generateDocNumber(company, branch, "DC");

        DeliveryChallan dc = DeliveryChallan.builder()
                .dcNumber(dcNumber)
                .dcDate(LocalDate.now())
                .company(company)
                .branch(branch)
                .customerType(customerType)
                .customer(customer)
                .guestName(customerType == CustomerType.GUEST ? request.getGuestName() : null)
                .vehicleNo(request.getVehicleNo().toUpperCase().trim())
                .truck(truck)
                .driverName(request.getDriverName())
                .product(product)
                .tareWeight(request.getTareWeight())
                .saleMode(saleMode)
                .rate(rate)
                .status(DcStatus.TARE_DONE)
                .build();

        dc = dcRepository.save(dc);
        return mapToResponse(dc);
    }

    // ═══════════════════════════════════════════════════════════
    //  UPDATE DC (Step 2: Gross weight + payment)
    // ═══════════════════════════════════════════════════════════

    @Transactional
    public DeliveryChallanResponse completeDc(UUID dcId, DeliveryChallanRequest request) {
        DeliveryChallan dc = dcRepository.findById(dcId)
                .orElseThrow(() -> new ResourceNotFoundException("DC not found"));

        if (dc.getStatus() != DcStatus.TARE_DONE && dc.getStatus() != DcStatus.UNPAID) {
            throw new IllegalStateException("DC cannot be completed in its current status: " + dc.getStatus());
        }

        // Set weights & details
        if (request.getGrossWeight() != null) dc.setGrossWeight(request.getGrossWeight());
        if (request.getDriverName() != null) dc.setDriverName(request.getDriverName());
        if (request.getRemarks() != null) dc.setRemarks(request.getRemarks());
        
        // Product/Rate can be updated if needed (re-calculates amount via @PreUpdate)
        if (request.getRate() != null) dc.setRate(request.getRate());

        if (dc.getSaleMode() == SaleMode.POS) {
            // POS mode: handle payment
            if (request.getPaymentMethod() != null) {
                dc.setPaymentMethod(PaymentMethod.valueOf(request.getPaymentMethod().toUpperCase()));
            }

            BigDecimal upi = request.getUpiAmount() != null ? request.getUpiAmount() : BigDecimal.ZERO;
            BigDecimal cash = request.getCashAmount() != null ? request.getCashAmount() : BigDecimal.ZERO;
            BigDecimal totalPaid = upi.add(cash);
            
            dc.setUpiAmount(upi);
            dc.setCashAmount(cash);
            dc.setPaidAmount(totalPaid);
            
            dc.setTeaCash(request.getTeaCash() != null ? request.getTeaCash() : BigDecimal.ZERO);
            dc.setTransportAmount(request.getTransportAmount() != null ? request.getTransportAmount() : BigDecimal.ZERO);
            dc.setLoadAmount(request.getLoadAmount() != null ? request.getLoadAmount() : BigDecimal.ZERO);
            dc.setGstAmount(request.getGstAmount() != null ? request.getGstAmount() : BigDecimal.ZERO);
            dc.setGstPercent(request.getGstPercent());
            
            dc.setGstBillRequested(Boolean.TRUE.equals(request.getGstBillRequested()));

            // Status logic: if paid < required -> UNPAID
            BigDecimal totalRequired = dc.getAmount() != null ? dc.getAmount() : BigDecimal.ZERO;
            if (totalPaid.compareTo(totalRequired) >= 0) {
                dc.setStatus(DcStatus.COMPLETED);
            } else {
                dc.setStatus(DcStatus.UNPAID);
            }
        } else {
            // Credit mode: no individual payment required at DC level
            dc.setStatus(DcStatus.COMPLETED);
        }

        dc = dcRepository.save(dc);
        return mapToResponse(dc);
    }

    // ═══════════════════════════════════════════════════════════
    //  PAY LATER: Settle unpaid DC
    // ═══════════════════════════════════════════════════════════

    @Transactional
    public DeliveryChallanResponse settlePayment(UUID dcId, String paymentMethod, BigDecimal amount) {
        DeliveryChallan dc = dcRepository.findById(dcId)
                .orElseThrow(() -> new RuntimeException("DC not found"));

        if (dc.getStatus() != DcStatus.UNPAID) {
            throw new RuntimeException("DC is not in UNPAID status");
        }

        dc.setPaymentMethod(PaymentMethod.valueOf(paymentMethod.toUpperCase()));
        dc.setPaidAmount(dc.getPaidAmount().add(amount));

        // Check if fully paid
        if (dc.getAmount() != null && dc.getPaidAmount().compareTo(dc.getAmount()) >= 0) {
            dc.setStatus(DcStatus.COMPLETED);
        }

        dc = dcRepository.save(dc);
        return mapToResponse(dc);
    }

    // ═══════════════════════════════════════════════════════════
    //  PAY LATER: Search unpaid DCs
    // ═══════════════════════════════════════════════════════════

    @Transactional(readOnly = true)
    public List<DeliveryChallanResponse> findUnpaidByVehicle(String vehicleNo) {
        return dcRepository.findByVehicleNoAndStatusOrderByDcDateDesc(
                        vehicleNo.toUpperCase().trim(), DcStatus.UNPAID)
                .stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<DeliveryChallanResponse> findUnpaidByCustomer(UUID customerId) {
        return dcRepository.findByCustomerIdAndStatusOrderByDcDateDesc(customerId, DcStatus.UNPAID)
                .stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<DeliveryChallanResponse> findUnpaidByGuestName(String name) {
        return dcRepository.findByGuestNameContainingIgnoreCaseAndStatusOrderByDcDateDesc(name, DcStatus.UNPAID)
                .stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    // ═══════════════════════════════════════════════════════════
    //  OUTSTANDING CHECK
    // ═══════════════════════════════════════════════════════════

    @Transactional(readOnly = true)
    public BigDecimal getOutstandingByVehicle(String vehicleNo) {
        return dcRepository.findOutstandingByVehicle(vehicleNo.toUpperCase().trim());
    }

    // ═══════════════════════════════════════════════════════════
    //  LIST DCs (with filters)
    // ═══════════════════════════════════════════════════════════

    @Transactional(readOnly = true)
    public PaginatedResponse<DeliveryChallanResponse> listDcs(
            UUID companyId, UUID branchId, String status, String search, Pageable pageable) {

        Specification<DeliveryChallan> spec = buildSpec(companyId, branchId, status, search);
        Page<DeliveryChallan> page = dcRepository.findAll(spec, pageable);

        List<DeliveryChallanResponse> content = page.getContent().stream()
                .map(this::mapToResponse).collect(Collectors.toList());

        return PaginatedResponse.<DeliveryChallanResponse>builder()
                .content(content)
                .pageNumber(page.getNumber())
                .pageSize(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .last(page.isLast())
                .build();
    }

    @Transactional(readOnly = true)
    public DeliveryChallanResponse getDcById(UUID id) {
        DeliveryChallan dc = dcRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("DC not found"));
        return mapToResponse(dc);
    }

    // ═══════════════════════════════════════════════════════════
    //  PRIVATE HELPERS
    // ═══════════════════════════════════════════════════════════

    private void validateCustomerSaleMode(CustomerType type, SaleMode mode) {
        if (mode == SaleMode.POS && type == CustomerType.CORPORATE) {
            throw new RuntimeException("Corporate customers can only use Credit mode");
        }
        if (mode == SaleMode.CREDIT && type == CustomerType.GUEST) {
            throw new RuntimeException("Guest customers cannot use Credit mode");
        }
    }

    private BigDecimal resolveRate(CustomerType type, SaleMode mode,
                                   Customer customer, Product product, Branch branch) {
        if (type == CustomerType.GUEST) {
            // General rate from ProductPrice for this branch
            return productPriceRepository.findByProductId(product.getId()).stream()
                    .filter(pp -> pp.getBranch().getId().equals(branch.getId()))
                    .findFirst()
                    .map(pp -> pp.getRate())
                    .orElse(BigDecimal.ZERO);
        }

        // For Local/Corporate — check CustomerPrice first
        if (customer != null) {
            List<CustomerPrice> prices = customerPriceRepository.findByCustomerId(customer.getId());
            for (CustomerPrice cp : prices) {
                if (cp.getProduct() != null && cp.getProduct().getId().equals(product.getId())) {
                    if (mode == SaleMode.POS && cp.getCashRate() != null) {
                        return BigDecimal.valueOf(cp.getCashRate());
                    }
                    if (mode == SaleMode.CREDIT && cp.getCreditRate() != null) {
                        return BigDecimal.valueOf(cp.getCreditRate());
                    }
                    if (cp.getRate() != null) {
                        return BigDecimal.valueOf(cp.getRate());
                    }
                }
            }
        }

        // Fallback to general ProductPrice
        return productPriceRepository.findByProductId(product.getId()).stream()
                .filter(pp -> pp.getBranch().getId().equals(branch.getId()))
                .findFirst()
                .map(pp -> pp.getRate())
                .orElse(BigDecimal.ZERO);
    }

    /**
     * Thread-safe document number generation.
     * Format: {CompanyInitial}/{BranchCode}/DC/{FY}/{Serial}
     */
    @Transactional
    public String generateDocNumber(Company company, Branch branch, String docType) {
        String fy = getCurrentFinancialYear();
        String prefix = buildPrefix(company, branch, docType, fy);

        SequenceNumber seq = seqRepository.findForUpdate(company.getId(), branch.getId(), docType, fy)
                .orElseGet(() -> {
                    SequenceNumber newSeq = SequenceNumber.builder()
                            .company(company)
                            .branch(branch)
                            .documentType(docType)
                            .financialYear(fy)
                            .lastNumber(0L)
                            .build();
                    return seqRepository.save(newSeq);
                });

        seq.setLastNumber(seq.getLastNumber() + 1);
        seqRepository.save(seq);

        return prefix + String.format("%05d", seq.getLastNumber());
    }

    private String buildPrefix(Company company, Branch branch, String docType, String fy) {
        String compCode = company.getInvoiceInitial() != null
                ? company.getInvoiceInitial()
                : company.getName().substring(0, Math.min(3, company.getName().length())).toUpperCase();
        String brCode = branch.getName().substring(0, Math.min(2, branch.getName().length())).toUpperCase();
        return compCode + "/" + brCode + "/" + docType + "/" + fy + "/";
    }

    private String getCurrentFinancialYear() {
        LocalDate today = LocalDate.now();
        int startYear = today.getMonth().getValue() >= Month.APRIL.getValue()
                ? today.getYear() : today.getYear() - 1;
        int endYear = startYear + 1;
        return startYear + "-" + String.valueOf(endYear).substring(2);
    }

    private Specification<DeliveryChallan> buildSpec(UUID companyId, UUID branchId, String status, String search) {
        return (root, query, cb) -> {
            var predicates = new java.util.ArrayList<jakarta.persistence.criteria.Predicate>();

            if (companyId != null) {
                predicates.add(cb.equal(root.get("company").get("id"), companyId));
            }
            if (branchId != null) {
                predicates.add(cb.equal(root.get("branch").get("id"), branchId));
            }
            if (status != null && !status.isEmpty()) {
                predicates.add(cb.equal(root.get("status"), DcStatus.valueOf(status.toUpperCase())));
            }
            if (search != null && !search.isEmpty()) {
                String pattern = "%" + search.toLowerCase() + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("dcNumber")), pattern),
                        cb.like(cb.lower(root.get("vehicleNo")), pattern),
                        cb.like(cb.lower(root.get("guestName")), pattern),
                        cb.like(cb.lower(root.get("driverName")), pattern)
                ));
            }

            query.orderBy(cb.desc(root.get("dcDate")), cb.desc(root.get("createdAt")));
            return cb.and(predicates.toArray(new jakarta.persistence.criteria.Predicate[0]));
        };
    }

    private DeliveryChallanResponse mapToResponse(DeliveryChallan dc) {
        BigDecimal outstanding = BigDecimal.ZERO;
        if (dc.getAmount() != null && dc.getPaidAmount() != null) {
            outstanding = dc.getAmount().subtract(dc.getPaidAmount());
            if (outstanding.compareTo(BigDecimal.ZERO) < 0) outstanding = BigDecimal.ZERO;
        }

        String customerName = dc.getCustomerType() == CustomerType.GUEST
                ? dc.getGuestName()
                : (dc.getCustomer() != null ? dc.getCustomer().getName() : "");

        String customerCode = dc.getCustomer() != null ? dc.getCustomer().getCustomerCode() : "-";

        return DeliveryChallanResponse.builder()
                .id(dc.getId())
                .dcNumber(dc.getDcNumber())
                .dcDate(dc.getDcDate())
                .companyId(dc.getCompany().getId())
                .companyName(dc.getCompany().getName())
                .branchId(dc.getBranch().getId())
                .branchName(dc.getBranch().getName())
                .customerType(dc.getCustomerType().name())
                .customerId(dc.getCustomer() != null ? dc.getCustomer().getId() : null)
                .customerName(customerName)
                .customerCode(customerCode)
                .vehicleNo(dc.getVehicleNo())
                .truckId(dc.getTruck() != null ? dc.getTruck().getId() : null)
                .driverName(dc.getDriverName())
                .productId(dc.getProduct().getId())
                .productName(dc.getProduct().getName())
                .tareWeight(dc.getTareWeight())
                .grossWeight(dc.getGrossWeight())
                .netWeight(dc.getNetWeight())
                .saleMode(dc.getSaleMode().name())
                .paymentMethod(dc.getPaymentMethod() != null ? dc.getPaymentMethod().name() : null)
                .rate(dc.getRate())
                .amount(dc.getAmount())
                .paidAmount(dc.getPaidAmount())
                .upiAmount(dc.getUpiAmount())
                .cashAmount(dc.getCashAmount())
                .teaCash(dc.getTeaCash())
                .transportAmount(dc.getTransportAmount())
                .loadAmount(dc.getLoadAmount())
                .gstAmount(dc.getGstAmount())
                .gstPercent(dc.getGstPercent())
                .remarks(dc.getRemarks())
                .outstandingAmount(outstanding)
                .gstBillRequested(dc.getGstBillRequested())
                .status(dc.getStatus().name())
                .build();
    }
}
