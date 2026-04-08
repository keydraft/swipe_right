package com.keydraft.mines.dto;

import lombok.Builder;
import lombok.Data;
import java.util.UUID;

@Data
@Builder
public class TransporterResponse {
    private UUID id;
    private String iCode;
    private String name;
    private String gstin;
    private AddressResponse address;
    private String phone;
}
