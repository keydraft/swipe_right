package com.keydraft.mines.entity;

import com.keydraft.mines.entity.enums.Gender;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "employees")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Employee extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(unique = true)
    private String employeeCode;

    // --- STEP 1: BASIC DETAILS ---
    @Column(nullable = false)
    private String firstName;
    
    @Column(nullable = false)
    private String lastName;

    @Enumerated(EnumType.STRING)
    private Gender gender;

    // Hierarchy Link
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "role_id")
    private Role designation; 

    private LocalDate dateOfBirth;
    private LocalDate dateOfJoining;

    @Column(nullable = false)
    private String contactNumber;

    private String email;

    @Embedded
    private Address address;

    // --- STEP 2: DOCUMENTS & SALARY ---
    private String salaryType;
    private Double basicSalary;

    private String bankAccountHolderName;
    private String bankName;
    private String bankAccountNumber;
    private String ifscCode;
    
    private String passbookFilePath; 

    private String aadhaarNumber;
    private String aadhaarFilePath; 

    private String panNumber;
    private String panFilePath; 

    private String drivingLicenseNumber;
    private String drivingLicenseFilePath; 

    @Builder.Default
    private boolean active = true;

    // --- ASSOCIATIONS (The source of truth for Company/Branch) ---
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "branch_id")
    private Branch branch;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user; // Optional login account
}
