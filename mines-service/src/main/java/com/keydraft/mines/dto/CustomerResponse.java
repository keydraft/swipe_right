package com.keydraft.mines.dto;

import com.keydraft.mines.entity.enums.CustomerType;
import lombok.Builder;
import lombok.Data;
import java.util.List;
import java.util.UUID;

@Data
@Builder
public class CustomerResponse {
    private UUID id;
    private String customerCode;
    private String name;
    private CustomerType type;
    private String phone;
    private String email;
    private String gstin;
    private boolean active;
    private AddressResponse address;
    private List<CustomerSiteResponse> sites;
    private List<CustomerPriceResponse> prices;
    private UUID companyId;
    private String companyName;
    private UUID branchId;
    private String branchName;
}
