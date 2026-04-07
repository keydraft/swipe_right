package com.keydraft.mines.dto;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuthResponse {
    private String username;
    private String role;
    private boolean resetRequired;
}
