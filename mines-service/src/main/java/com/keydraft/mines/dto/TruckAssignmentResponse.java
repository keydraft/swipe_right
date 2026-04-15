package com.keydraft.mines.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TruckAssignmentResponse {
    private UUID id;
    private UUID truckId;
    private String truckNo;
    private UUID companyId;
    private String companyName;
    private UUID branchId;
    private String branchName;
    private boolean active;
}
