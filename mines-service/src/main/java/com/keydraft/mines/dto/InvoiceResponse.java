package com.keydraft.mines.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InvoiceResponse {
    private UUID id;
    private String invoiceNumber;
    private LocalDate invoiceDate;
    
    private String customerName;
    private String companyName;
    private String branchName;
    
    private BigDecimal totalAmount;
    private BigDecimal gstAmount;
    private BigDecimal grandTotal;
    private String paymentTerms;
    private String status;
    
    private List<DeliveryChallanResponse> deliveryChallans;
}
