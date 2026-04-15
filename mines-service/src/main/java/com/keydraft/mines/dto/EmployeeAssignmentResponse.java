package com.keydraft.mines.dto;

import lombok.*;
import java.time.LocalDate;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EmployeeAssignmentResponse {
    private UUID id;
    private String companyName;
    private String branchName;
    private UUID companyId;
    private UUID branchId;
    private LocalDate startDate;
    private LocalDate endDate;
    private boolean current;
}
