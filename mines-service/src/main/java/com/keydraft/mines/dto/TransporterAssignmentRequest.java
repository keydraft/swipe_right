package com.keydraft.mines.dto;

import lombok.Data;
import java.util.UUID;

@Data
public class TransporterAssignmentRequest {
    private UUID transporterId;
    private UUID companyId;
    private UUID branchId;
}
