package com.keydraft.mines.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

@Data
public class TransporterRequest {
    private java.util.UUID companyId;
    private java.util.UUID branchId;
    @JsonProperty("iCode")
    private String iCode;
    private String name;
    private String gstin;
    private AddressRequest address;
    private String phone;
}
