package com.keydraft.mines.dto;

import lombok.*;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AddressResponse {
    private UUID id;
    private String addressLine1;
    private String addressLine2;
    private String district;
    private String state;
    private String pincode;
}
