package com.keydraft.mines.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BranchRequest {

    @NotBlank(message = "Site type is required (PRODUCTION or OFFICE)")
    private String siteType;

    @NotBlank(message = "Branch type is required (CRUSHER, YARD, QUARRY, INTERGAT)")
    private String branchType;

    @NotBlank(message = "Branch name is required")
    private String name;
    
    @NotBlank(message = "Branch contact phone is required")
    @Pattern(regexp = "^[0-9]{10,12}$", message = "Phone must be 10-12 digits")
    private String phone;
    
    @Pattern(regexp = "^$|[0-9]{10,12}$", message = "Phone must be 10-12 digits")
    private String alternatePhoneNo;

    @jakarta.validation.constraints.Email(message = "Invalid email format")
    private String emailId;

    @Valid
    private AddressRequest address;
}
