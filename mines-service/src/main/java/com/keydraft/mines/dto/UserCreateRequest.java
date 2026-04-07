package com.keydraft.mines.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserCreateRequest {

    @NotBlank(message = "Username is required")
    @Size(min = 3, max = 50, message = "Username must be between 3 and 50 characters")
    private String username;

    @NotBlank(message = "Password is required")
    @Size(min = 6, message = "Password must be at least 6 characters long")
    private String password;

    @NotBlank(message = "Role name is required")
    private String roleName;

    // For PARTNER: list of company IDs to link to (all branches)
    // For other roles: use companyId + branchId
    // For ADMIN: leave all null
    private List<UUID> companyIds;

    // For non-admin, non-partner roles: exactly one company
    private UUID companyId;

    // For non-admin, non-partner roles: exactly one branch
    private UUID branchId;
}
