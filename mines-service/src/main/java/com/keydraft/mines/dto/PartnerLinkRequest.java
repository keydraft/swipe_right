package com.keydraft.mines.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class PartnerLinkRequest {
    private String username; // The owner/user to be linked
    private UUID companyId; // The company where they will be a partner
}
