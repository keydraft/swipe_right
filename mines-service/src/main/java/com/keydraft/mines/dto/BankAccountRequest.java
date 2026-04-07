package com.keydraft.mines.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.*;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BankAccountRequest {
    @NotBlank(message = "Account name is required")
    private String accountName;
    private String shortName;
    @NotBlank(message = "Account number is required")
    private String accountNumber;
    private String bankName;
    private String branchName;
    @Pattern(regexp = "^[A-Z]{4}0[A-Z0-9]{6}$", message = "Invalid IFSC format")
    private String ifscCode;
    private Double openingBalance;
    private LocalDate openingDate;
}
