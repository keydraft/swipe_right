package com.keydraft.mines.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Table(name = "source_base_prices")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SourceBasePrice extends BaseEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "source_site_id", nullable = false)
    private UUID sourceSiteId;

    @Column(name = "product_id", nullable = false)
    private UUID productId;

    @Column(name = "base_rate", nullable = false)
    private BigDecimal baseRate;
}
