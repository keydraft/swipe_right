package com.keydraft.mines.dto;

import lombok.*;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BranchResponse {
    private UUID id;
    private String name;
    private String siteType;
    private String branchType;
    private String phone;
    private String alternatePhoneNo;
    private String emailId;
    private AddressResponse address;
}
