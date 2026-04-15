package com.keydraft.mines.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.util.UUID;

@Data
public class PricingQuoteRequest {
    @NotNull
    private UUID sourceBranchId;

    @NotNull
    private UUID destinationSiteId;

    @NotNull
    private UUID productId;
}
