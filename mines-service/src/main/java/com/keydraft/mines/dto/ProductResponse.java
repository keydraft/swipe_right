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
public class ProductResponse {
    private UUID id;
    private String name;
    private String shortName;
    private String hsnCode;
    private Double gstPercentage;
    private RMType rmType;
    private boolean active;
    private UUID companyId;
    private String companyName;
    private List<PriceResponse> prices;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PriceResponse {
        private UUID branchId;
        private String branchName;
        private BigDecimal rate;
    }
}
