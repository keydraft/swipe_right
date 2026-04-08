package com.keydraft.mines.dto;

import lombok.Data;
import java.util.List;

@Data
public class CustomerSiteRequest {
    private String siteName;
    private AddressRequest address;
    private String phone;
    private String alternatePhone;
    private Double driverSalary;
    private List<CustomerPriceRequest> prices;
}
