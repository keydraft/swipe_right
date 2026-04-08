package com.keydraft.mines.dto;

import com.keydraft.mines.entity.enums.UOM;
import lombok.*;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CustomerSitePriceResponse {
    private UUID id;
    private UUID productId;
    private String productName;
    private Double rate;
    private UOM uom;
    private Double tonnageLimit;
}
