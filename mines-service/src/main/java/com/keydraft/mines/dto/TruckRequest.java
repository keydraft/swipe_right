package com.keydraft.mines.dto;

import com.keydraft.mines.entity.enums.OwnershipType;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TruckRequest {
    private OwnershipType ownershipType;
    private String truckNo;
    private String ownerName;
    private UUID transporterId;
    private UUID customerId;
    private String make;
    private String model;
    private String engineNo;
    private String chassisNo;
    private LocalDate insuranceValidity;
    private LocalDate permitValidity;
    private LocalDate fcValidity;
    private String usageType;
    private String fuelType;
    private Double tareWeight;
}
