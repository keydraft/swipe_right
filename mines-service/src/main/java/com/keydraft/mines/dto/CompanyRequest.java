package com.keydraft.mines.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Email;
import lombok.*;

import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CompanyRequest {
    
    private UUID id;

    @NotBlank(message = "Company name is required")
    @Size(min = 2, max = 100, message = "Company name must be between 2 and 100 characters")
    private String name;

    @Valid
    @NotNull(message = "Address is required")
    private AddressRequest address;

    @NotBlank(message = "Primary Phone is required")
    @Pattern(regexp = "^[0-9]{10,12}$", message = "Phone must be 10-12 digits")
    private String phone;
    
    @Pattern(regexp = "^$|[0-9]{10,12}$", message = "Phone must be 10-12 digits")
    private String alternatePhoneNo;

    @Email(message = "Invalid email format")
    private String emailId;

    @NotBlank(message = "Invoice initial is required")
    private String invoiceInitial;

    @NotBlank(message = "GSTN is required")
    @Pattern(regexp = "^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$", message = "Invalid GSTIN format")
    private String gstin;

    @Valid
    private List<BankAccountRequest> bankAccounts;

    @Valid
    private List<BranchRequest> branches;
}
