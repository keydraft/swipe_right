package com.keydraft.mines.entity;

import com.keydraft.mines.entity.enums.OwnershipType;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "trucks")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Truck extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private OwnershipType ownershipType;

    @Column(nullable = false, unique = true)
    private String truckNo;

    private String registerName;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "transporter_id")
    private Transporter transporter;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id")
    private Customer customer;

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

    // File Paths
    private String rcFrontPath;
    private String rcBackPath;
    private String insurancePath;
    private String permitPath;
    private String fcPath;
}
