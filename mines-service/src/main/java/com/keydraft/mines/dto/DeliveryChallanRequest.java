package com.keydraft.mines.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DeliveryChallanRequest {

    // ─── Sale Mode ──────────────────────────────────────────
    @NotBlank(message = "Sale mode is required")
    private String saleMode; // "POS" or "CREDIT"

    // ─── Customer ───────────────────────────────────────────
    @NotBlank(message = "Customer type is required")
    private String customerType; // "GUEST", "LOCAL", "CORPORATE"

    private UUID customerId;    // required for LOCAL / CORPORATE
    private String guestName;   // required for GUEST

    // ─── Vehicle & Driver ───────────────────────────────────
    @NotBlank(message = "Vehicle number is required")
    private String vehicleNo;

    private UUID truckId;       // null if manual entry
    private String driverName;

    // ─── Product ────────────────────────────────────────────
    @NotNull(message = "Product is required")
    private UUID productId;

    // ─── Weight ─────────────────────────────────────────────
    private Double tareWeight;
    private Double grossWeight;

    // ─── Payment & Billing ──────────────────────────────────
    private BigDecimal rate;
    private String paymentMethod;  // CASH, UPI, MIXED
    private BigDecimal paidAmount;
    private BigDecimal upiAmount;
    private BigDecimal cashAmount;
    private BigDecimal teaCash;
    private BigDecimal gstPercent;
    private BigDecimal gstAmount;
    private BigDecimal transportAmount;
    private BigDecimal loadAmount;
    private String remarks;
    private Boolean gstBillRequested;

    // ─── Organization (from context) ────────────────────────
    @NotNull(message = "Company is required")
    private UUID companyId;

    @NotNull(message = "Branch is required")
    private UUID branchId;
}
