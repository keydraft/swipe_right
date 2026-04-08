package com.keydraft.mines.dto;

import com.keydraft.mines.entity.enums.UOM;
import lombok.*;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CustomerSitePriceRequest {
    private UUID productId;
    private Double rate;
    private UOM uom;
    private Double tonnageLimit;
}
