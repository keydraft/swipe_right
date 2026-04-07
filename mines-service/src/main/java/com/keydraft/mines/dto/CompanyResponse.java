package com.keydraft.mines.dto;

import lombok.*;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CompanyResponse {
    private UUID id;
    private String name;
    private String invoiceInitial;
    private String gstin;
    private String phone;
    private String alternatePhoneNo;
    private String emailId;

    private AddressResponse address;
    private List<BankAccountResponse> bankAccounts;
    private List<BranchResponse> branches;
    private boolean active;
}
