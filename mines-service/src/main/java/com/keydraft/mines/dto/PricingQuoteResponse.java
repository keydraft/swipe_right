package com.keydraft.mines.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PricingQuoteResponse {
    private UUID sourceBranchId;
    private UUID destinationSiteId;
    private UUID productId;
    private BigDecimal baseRate;
    private BigDecimal transportRate;
    private BigDecimal finalPerUnitRate;
    private String appliedStrategy;
}
