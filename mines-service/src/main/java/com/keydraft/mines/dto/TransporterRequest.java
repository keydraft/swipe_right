package com.keydraft.mines.dto;

import lombok.Data;

@Data
public class TransporterRequest {
    private String iCode;
    private String name;
    private String gstin;
    private AddressRequest address;
    private String phone;
}
