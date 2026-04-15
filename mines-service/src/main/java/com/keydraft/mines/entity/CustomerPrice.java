package com.keydraft.mines.entity;

import com.keydraft.mines.entity.enums.UOM;
import jakarta.persistence.*;
import lombok.*;
import java.util.UUID;

@Entity
@Table(name = "customer_prices")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CustomerPrice extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id")
    private Customer customer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "site_id")
    private CustomerSite site;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id")
    private Company company;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "branch_id")
    private Branch branch;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    // Common fields
    private Double rate;
    private Double tonnageLimit;
    @Builder.Default
    private Boolean gstInclusive = false;
    
    @Enumerated(EnumType.STRING)
    private UOM uom;

    // Fields for Local (Screenshot 1)
    private Double cashRate;
    private Double creditRate;

    // Fields for Corporate (Screenshot 3)
    private Double transportRate;
}
