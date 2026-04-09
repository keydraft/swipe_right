package com.keydraft.mines.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

@Data
public class TransporterRequest {
    @JsonProperty("iCode")
    private String iCode;
    private String name;
    private String gstin;
    private AddressRequest address;
    private String phone;
}
