package com.keydraft.mines.dto;

import com.keydraft.mines.entity.enums.CustomerType;
import lombok.Data;
import java.util.List;

@Data
public class CustomerRequest {
    private String name;
    private CustomerType type;
    private String phone;
    private String email;
    private String gstin;
    private AddressRequest address;
    private List<CustomerSiteRequest> sites;
    private List<CustomerPriceRequest> prices;
    private Boolean active;
}
