package com.keydraft.mines.dto;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DeliveryChallanResponse {

    private UUID id;
    private String dcNumber;
    private LocalDate dcDate;

    // Organization
    private UUID companyId;
    private String companyName;
    private UUID branchId;
    private String branchName;

    // Customer
    private String customerType;
    private UUID customerId;
    private String customerName;   // resolved: guestName or customer.name
    private String customerCode;

    // Vehicle & Driver
    private String vehicleNo;
    private UUID truckId;
    private String driverName;

    // Product
    private UUID productId;
    private String productName;

    // Weights
    private Double tareWeight;
    private Double grossWeight;
    private Double netWeight;

    // Sale & Payment
    private String saleMode;
    private String paymentMethod;
    private BigDecimal rate;
    private BigDecimal amount;
    private BigDecimal paidAmount;
    private BigDecimal upiAmount;
    private BigDecimal cashAmount;
    private BigDecimal teaCash;
    private BigDecimal gstPercent;
    private BigDecimal gstAmount;
    private BigDecimal transportAmount;
    private BigDecimal loadAmount;
    private BigDecimal outstandingAmount;
    private String remarks;
    private Boolean gstBillRequested;

    // Status
    private String status;
}
