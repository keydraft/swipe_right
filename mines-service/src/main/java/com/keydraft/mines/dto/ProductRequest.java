package com.keydraft.mines.dto;

import com.keydraft.mines.entity.enums.RMType;
import lombok.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductRequest {
    private String name;
    private String shortName;
    private String hsnCode;
    private Double gstPercentage;
    private RMType rmType;
    private boolean active;
    private UUID companyId;
    private List<PriceRequest> prices;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PriceRequest {
        private UUID branchId;
        private BigDecimal rate;
    }
}
