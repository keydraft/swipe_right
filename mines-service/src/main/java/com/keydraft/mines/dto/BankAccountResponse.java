package com.keydraft.mines.dto;

import lombok.*;
import java.util.UUID;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BankAccountResponse {
    private UUID id;
    private String accountName;
    private String shortName;
    private String accountNumber;
    private String bankName;
    private String branchName;
    private String ifscCode;
    private Double openingBalance;
    private LocalDate openingDate;
}
