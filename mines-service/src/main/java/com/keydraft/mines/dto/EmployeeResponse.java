package com.keydraft.mines.dto;

import lombok.*;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EmployeeResponse {
    private UUID id;
    private String employeeCode;
    private String firstName;
    private String lastName;
    private String fullName;
    
    private String gender;
    private LocalDate dateOfBirth;
    private LocalDate dateOfJoining;
    private String phone;
    private String email;
    private AddressResponse address;
    
    private String designation;
    private String department;
    
    private String panNumber;
    private String aadhaarNumber;
    private String drivingLicenseNumber;
    
    private String salaryType;
    private Double basicSalary;
    
    private String bankAccountHolderName;
    private String bankName;
    private String bankAccountNumber;
    private String ifscCode;
    
    private String username;
    
    private UUID companyId;
    private List<UUID> companyIds; // Added to store the Partner's multi-company authorization list
    private UUID branchId;
    private String branchName;
    private String companyName;
    private boolean active;

    private String passbookFilePath;
    private String aadhaarFilePath;
    private String panFilePath;
    private String drivingLicenseFilePath;
}
