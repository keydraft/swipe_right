package com.keydraft.mines.dto;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuthResponse {
    private String username;
    private String role;
    private java.util.Set<String> permissions;
    private boolean resetRequired;
    private java.util.List<UserResponse.UserCompanyInfo> companies;
}
