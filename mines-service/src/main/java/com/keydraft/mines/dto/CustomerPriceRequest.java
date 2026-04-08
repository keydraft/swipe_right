package com.keydraft.mines.dto;

import com.keydraft.mines.entity.enums.UOM;
import lombok.*;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CustomerPriceRequest {
    private UUID productId;
    private Double rate;
    private Double cashRate;
    private Double creditRate;
    private Double transportRate;
    private Double tonnageLimit;
    private Boolean gstInclusive;
    private UOM uom;
}
