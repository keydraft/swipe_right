package com.keydraft.mines.dto;

import lombok.Data;
import java.util.UUID;

@Data
public class TruckAssignmentRequest {
    private UUID truckId;
    private UUID companyId;
    private UUID branchId;
    private java.util.List<UUID> companyIds;
    private java.util.List<UUID> branchIds;
}
