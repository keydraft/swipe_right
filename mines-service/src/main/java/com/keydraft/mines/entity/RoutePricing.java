package com.keydraft.mines.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Table(name = "route_pricing_overrides")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RoutePricing extends BaseEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "from_source_id", nullable = false)
    private UUID fromSourceId;

    @Column(name = "to_destination_id", nullable = false)
    private UUID toDestinationId;

    @Column(name = "product_id", nullable = false)
    private UUID productId;

    @Column(name = "final_total_rate", nullable = false)
    private BigDecimal finalTotalRate;
}
