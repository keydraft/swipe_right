package com.keydraft.mines.dto;

import lombok.*;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserResponse {
    private UUID id;
    private String username;
    private String roleName;
    private boolean enabled;

    // For non-admin users: their company/branch associations
    private List<UserCompanyInfo> companies;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UserCompanyInfo {
        private UUID companyId;
        private String companyName;
        private UUID branchId;
        private String branchName; // null for PARTNER (means all branches)
    }
}
