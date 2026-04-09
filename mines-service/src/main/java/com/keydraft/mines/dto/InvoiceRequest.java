package com.keydraft.mines.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InvoiceRequest {
    private List<UUID> dcIds;
    private String paymentTerms;
    private UUID companyId;
    private UUID branchId;
    private UUID customerId;
}
