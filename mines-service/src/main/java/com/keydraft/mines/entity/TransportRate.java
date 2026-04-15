package com.keydraft.mines.entity;

import com.keydraft.mines.entity.enums.TransportCalcMode;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Table(name = "transport_rates")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TransportRate extends BaseEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "from_source_id")
    private UUID fromSourceId;

    @Column(name = "to_destination_id")
    private UUID toDestinationId;

    @Enumerated(EnumType.STRING)
    @Column(name = "calc_mode")
    private TransportCalcMode calcMode;

    @Column(name = "transport_rate", nullable = false)
    private BigDecimal transportRate;
}