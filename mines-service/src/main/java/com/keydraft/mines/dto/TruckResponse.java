package com.keydraft.mines.dto;

import com.keydraft.mines.entity.enums.OwnershipType;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.util.UUID;

@Data
@Builder
public class TruckResponse {
    private UUID id;
    private OwnershipType ownershipType;
    private String truckNo;
    private String ownerName;
    private UUID transporterId;
    private String transporterName;
    private UUID customerId;
    private String customerName;
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
    private String rcFrontPath;
    private String rcBackPath;
    private String insurancePath;
    private String permitPath;
    private String fcPath;
}
