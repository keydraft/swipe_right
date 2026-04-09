package com.keydraft.mines.entity;

import com.keydraft.mines.entity.enums.CustomerType;
import com.keydraft.mines.entity.enums.DcStatus;
import com.keydraft.mines.entity.enums.PaymentMethod;
import com.keydraft.mines.entity.enums.SaleMode;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "delivery_challans", indexes = {
    @Index(name = "idx_dc_company_branch", columnList = "company_id, branch_id"),
    @Index(name = "idx_dc_customer", columnList = "customer_id"),
    @Index(name = "idx_dc_vehicle", columnList = "vehicle_no"),
    @Index(name = "idx_dc_status", columnList = "status"),
    @Index(name = "idx_dc_date", columnList = "dc_date"),
    @Index(name = "idx_dc_number", columnList = "dc_number", unique = true)
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DeliveryChallan extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "dc_number", nullable = false, unique = true)
    private String dcNumber;

    @Column(name = "dc_date", nullable = false)
    private LocalDate dcDate;

    // ─── Organization ───────────────────────────────────────
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id", nullable = false)
    private Company company;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "branch_id", nullable = false)
    private Branch branch;

    // ─── Customer Info ──────────────────────────────────────
    @Enumerated(EnumType.STRING)
    @Column(name = "customer_type", nullable = false)
    private CustomerType customerType; // GUEST, LOCAL, CORPORATE

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id")
    private Customer customer; // null for GUEST

    @Column(name = "guest_name")
    private String guestName; // only for GUEST

    // ─── Vehicle & Driver ───────────────────────────────────
    @Column(name = "vehicle_no", nullable = false)
    private String vehicleNo;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "truck_id")
    private Truck truck; // null if manual vehicle entry

    @Column(name = "driver_name")
    private String driverName;

    // ─── Product & Weight ───────────────────────────────────
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Column(name = "tare_weight")
    private Double tareWeight;

    @Column(name = "gross_weight")
    private Double grossWeight;

    @Column(name = "net_weight")
    private Double netWeight;

    // ─── Sale & Payment ─────────────────────────────────────
    @Enumerated(EnumType.STRING)
    @Column(name = "sale_mode", nullable = false)
    private SaleMode saleMode; // POS or CREDIT

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_method")
    private PaymentMethod paymentMethod; // CASH, UPI — only for POS mode

    @Column(precision = 12, scale = 2)
    private BigDecimal rate;

    @Column(precision = 14, scale = 2)
    private BigDecimal amount;

    @Column(name = "paid_amount", precision = 14, scale = 2)
    @Builder.Default
    private BigDecimal paidAmount = BigDecimal.ZERO;

    @Column(name = "upi_amount", precision = 14, scale = 2)
    private BigDecimal upiAmount;

    @Column(name = "cash_amount", precision = 14, scale = 2)
    private BigDecimal cashAmount;

    @Column(name = "tea_cash", precision = 12, scale = 2)
    private BigDecimal teaCash;

    @Column(name = "gst_percent", precision = 5, scale = 2)
    private BigDecimal gstPercent;

    @Column(name = "gst_amount", precision = 14, scale = 2)
    private BigDecimal gstAmount;

    @Column(name = "transport_amount", precision = 14, scale = 2)
    private BigDecimal transportAmount;

    @Column(name = "load_amount", precision = 14, scale = 2)
    private BigDecimal loadAmount;

    @Column(length = 500)
    private String remarks;

    @Column(name = "gst_bill_requested")
    @Builder.Default
    private Boolean gstBillRequested = false;

    // ─── Status ─────────────────────────────────────────────
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private DcStatus status = DcStatus.TARE_DONE;

    // ─── Invoice linkage (for Credit mode) ──────────────────
    @Column(name = "invoice_id")
    private UUID invoiceId; // set when compiled into invoice

    // ─── Helpers ────────────────────────────────────────────

    /**
     * Calculates net weight from gross and tare.
     * Called before persist/update when gross weight is set.
     */
    @PrePersist
    @PreUpdate
    private void calculateNetWeight() {
        if (grossWeight != null && tareWeight != null && grossWeight > 0) {
            this.netWeight = grossWeight - tareWeight;
            if (this.rate != null && this.netWeight > 0) {
                this.amount = this.rate.multiply(BigDecimal.valueOf(this.netWeight));
            }
        }
    }
}
