package com.keydraft.mines.dto;

import lombok.Builder;
import lombok.Data;
import java.util.List;
import java.util.UUID;

@Data
@Builder
public class CustomerSiteResponse {
    private UUID id;
    private String siteName;
    private String phone;
    private String alternatePhone;
    private Double driverSalary;
    private AddressResponse address;
    private List<CustomerPriceResponse> prices;
}
