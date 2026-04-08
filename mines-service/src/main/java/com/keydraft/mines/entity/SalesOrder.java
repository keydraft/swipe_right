package com.keydraft.mines.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "sales_orders")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SalesOrder extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    // Block 1: Transaction Metadata
    @Column(nullable = false)
    private String transactionType; // "POS" or "CREDIT"

    private LocalDateTime transactionDate;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id")
    private Customer customer; // Nullable for Cash & Carry

    private String customerCode; // "-", "Corporate", "Local"
    private String guestCustomerName; // For typing manually (Cash & Carry)

    // Block 2: Material & Logistics
    private String billNumber;
    
    @Column(nullable = false)
    private String vehicleNumber; // Manual typing

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    private Double balanceQty; // For Corporate
    private Double rate;

    // Weights
    private Double grossWeight;
    private LocalDateTime grossWeightTime;
    private Double tareWeight;
    private LocalDateTime tareWeightTime;
    private Double netWeight;

    // Financials
    private Double amount;
    private Double discount;
    private Double roundOff;
    private Double payableAmount;

    // Block 3: Payment Details
    private String billIncharge;
    private Double oldBalance;
    private Double cashReceived;
    private Double upiReceived;
    private String upiId;
    private Double currentBalance; // Pending balance for this transaction
}
