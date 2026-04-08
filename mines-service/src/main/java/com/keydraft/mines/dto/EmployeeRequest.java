package com.keydraft.mines.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EmployeeRequest {
    private UUID id;

    // --- STEP 1: BASIC DETAILS ---
    @NotBlank(message = "First Name is required")
    private String firstName;
    
    @NotBlank(message = "Last Name is required")
    private String lastName;

    @NotBlank(message = "Gender is required")
    private String gender;

    private String role;
    private String consignor;
    private String plant;

    @NotNull(message = "Date of Birth is required")
    private LocalDate dateOfBirth;

    @NotNull(message = "Date of Joining is required")
    private LocalDate dateOfJoining;

    @NotBlank(message = "Contact Number is required")
    private String contactNumber;

    private String email;

    private String addressLine1;
    private String addressLine2;
    private String district;
    private String state;
    private String pincode;

    // --- STEP 2: DOCUMENTS & SALARY ---
    private String salaryType;
    private Double basicSalary;

    private String bankAccountHolderName;
    private String bankName;
    private String bankAccountNumber;
    private String ifscCode;
    
    private String aadhaarNumber;
    private String panNumber;
    private String drivingLicenseNumber;

    // --- HIERARCHY ---
    private UUID companyId;
    private UUID branchId;
    private List<UUID> companyIds; // For Partner role: multi-select
    
    // --- STEP 3: LOGIN ACCESS ---
    private String username;
    private String password;
}
