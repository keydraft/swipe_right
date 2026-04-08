package com.keydraft.mines.service;

import com.keydraft.mines.dto.*;
import com.keydraft.mines.entity.*;
import com.keydraft.mines.entity.enums.Gender;
import com.keydraft.mines.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.security.SecureRandom;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmployeeService {

    private final EmployeeRepository employeeRepository;
    private final BranchRepository branchRepository;
    private final CompanyRepository companyRepository;
    private final RoleRepository roleRepository;
    private final UserRepository userRepository;
    private final UserCompanyRepository userCompanyRepository;
    private final FileStorageService fileStorageService;
    private final PasswordEncoder passwordEncoder;

    private static final String CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%";
    private final SecureRandom random = new SecureRandom();

    private String generateTempPassword() {
        StringBuilder sb = new StringBuilder(8);
        for (int i = 0; i < 8; i++) {
            sb.append(CHARS.charAt(random.nextInt(CHARS.length())));
        }
        return sb.toString();
    }

    private AddressResponse mapAddressResponse(Address address) {
        if (address == null)
            return null;
        return AddressResponse.builder()
                .id(address.getId())
                .addressLine1(address.getAddressLine1())
                .addressLine2(address.getAddressLine2())
                .district(address.getDistrict())
                .state(address.getState())
                .pincode(address.getPincode())
                .build();
    }

    private EmployeeResponse mapToResponse(Employee em) {
        EmployeeResponse.EmployeeResponseBuilder builder = EmployeeResponse.builder()
                .id(em.getId())
                .employeeCode(em.getEmployeeCode() != null ? em.getEmployeeCode() : "N/A")
                .firstName(em.getFirstName())
                .lastName(em.getLastName())
                .fullName(em.getFirstName() + " " + (em.getLastName() != null ? em.getLastName() : ""))
                .gender(em.getGender() != null ? em.getGender().name() : null)
                .dateOfBirth(em.getDateOfBirth())
                .dateOfJoining(em.getDateOfJoining())
                .phone(em.getContactNumber())
                .email(em.getEmail())
                .address(mapAddressResponse(em.getAddress()))
                .designation(em.getDesignation() != null ? em.getDesignation().getName() : "N/A")
                .department(em.getBranch() != null ? em.getBranch().getName() : "-")

                .panNumber(em.getPanNumber())
                .aadhaarNumber(em.getAadhaarNumber())
                .drivingLicenseNumber(em.getDrivingLicenseNumber())

                .salaryType(em.getSalaryType())
                .basicSalary(em.getBasicSalary())
                .bankAccountHolderName(em.getBankAccountHolderName())
                .bankName(em.getBankName())
                .bankAccountNumber(em.getBankAccountNumber())
                .ifscCode(em.getIfscCode())

                .username(em.getUser() != null ? em.getUser().getUsername() : null)
                .branchId(em.getBranch() != null ? em.getBranch().getId() : null)
                .branchName(em.getBranch() != null ? em.getBranch().getName() : "-")
                .companyName(em.getBranch() != null ? em.getBranch().getCompany().getName() : "-")
                .active(em.isActive());

        if (em.getUser() != null) {
            builder.companyIds(userCompanyRepository.findByUser(em.getUser()).stream()
                    .map(uc -> uc.getCompany().getId())
                    .collect(Collectors.toList()));
            if (em.getBranch() != null) {
                builder.companyId(em.getBranch().getCompany().getId());
            }
        }

        return builder.build();
    }

    private String generateEmployeeCode(Branch br) {
        String code;
        if (br == null) {
            code = "SYS" + String.format("%03d", employeeRepository.count() + 1);
        } else {
            Company co = br.getCompany();
            String coPart = (co.getInvoiceInitial() != null ? co.getInvoiceInitial()
                    : co.getName().substring(0, Math.min(3, co.getName().length()))).toUpperCase()
                    .replaceAll("[^A-Z0-9]", "");
            String brPart = br.getName().toUpperCase().replaceAll("[^A-Z0-9]", "").substring(0,
                    Math.min(3, br.getName().length()));
            String seqPart = String.format("%03d", employeeRepository.countByBranch(br) + 1);
            code = coPart + brPart + seqPart;
        }
        log.info("Generated Employee Code: {}", code);
        return code;
    }

    @Transactional
    public EmployeeResponse upsertEmployeeWithFiles(
            EmployeeRequest req,
            MultipartFile passbook,
            MultipartFile aadhaar,
            MultipartFile pan,
            MultipartFile dl) {

        log.info("Starting upsert for employee: {} {}", req.getFirstName(), req.getLastName());
        Employee emp = req.getId() != null ? employeeRepository.findById(req.getId()).orElseThrow() : new Employee();

        emp.setFirstName(req.getFirstName());
        emp.setLastName(req.getLastName());

        // Fix for Gender enum mismatch (others -> OTHERS vs OTHER)
        if (req.getGender() != null) {
            String genderStr = req.getGender().toUpperCase();
            if ("OTHERS".equals(genderStr))
                genderStr = "OTHER";
            emp.setGender(Gender.valueOf(genderStr));
        }

        emp.setDateOfBirth(req.getDateOfBirth());
        emp.setDateOfJoining(req.getDateOfJoining());
        emp.setContactNumber(req.getContactNumber());
        emp.setEmail(req.getEmail());

        // Map Address
        Address addr = emp.getAddress() != null ? emp.getAddress() : new Address();
        addr.setAddressLine1(req.getAddressLine1());
        addr.setAddressLine2(req.getAddressLine2());
        addr.setDistrict(req.getDistrict());
        addr.setState(req.getState());
        addr.setPincode(req.getPincode());
        emp.setAddress(addr);

        // Map Salary/Bank
        emp.setSalaryType(req.getSalaryType());
        emp.setBasicSalary(req.getBasicSalary());
        emp.setBankAccountHolderName(req.getBankAccountHolderName());
        emp.setBankName(req.getBankName());
        emp.setBankAccountNumber(req.getBankAccountNumber());
        emp.setIfscCode(req.getIfscCode());

        // --- FILE STORAGE (LOCAL) ---
        if (passbook != null)
            emp.setPassbookFilePath(fileStorageService.storeFile(passbook));
        if (aadhaar != null)
            emp.setAadhaarFilePath(fileStorageService.storeFile(aadhaar));
        if (pan != null)
            emp.setPanFilePath(fileStorageService.storeFile(pan));
        if (dl != null)
            emp.setDrivingLicenseFilePath(fileStorageService.storeFile(dl));

        emp.setAadhaarNumber(req.getAadhaarNumber());
        emp.setPanNumber(req.getPanNumber());
        emp.setDrivingLicenseNumber(req.getDrivingLicenseNumber());

        // --- HIERARCHY ---
        Role roleObj = null;
        if (req.getRole() != null) {
            roleObj = roleRepository.findByName(req.getRole().toUpperCase()).orElse(null);
            emp.setDesignation(roleObj);
        }

        if (req.getBranchId() != null) {
            Branch br = branchRepository.findById(req.getBranchId()).orElseThrow();
            emp.setBranch(br);
            if (emp.getEmployeeCode() == null || emp.getEmployeeCode().isEmpty()) {
                emp.setEmployeeCode(generateEmployeeCode(br));
            }
        } else if (emp.getEmployeeCode() == null || emp.getEmployeeCode().isEmpty()) {
            emp.setEmployeeCode(generateEmployeeCode(null));
        }

        // --- USER ACCOUNT CREATION ---
        if (req.getUsername() != null && !req.getUsername().trim().isEmpty()) {
            User user = emp.getUser() != null ? emp.getUser() : new User();
            user.setUsername(req.getUsername());

            // If new user or password provided, set password
            if (emp.getUser() == null || (req.getPassword() != null && !req.getPassword().trim().isEmpty())) {
                String plainPassword = (req.getPassword() != null && !req.getPassword().trim().isEmpty())
                        ? req.getPassword()
                        : generateTempPassword();

                log.info("USER ACCOUNT CREATED/UPDATED: [Username: {}] [Temp Password: {}]", req.getUsername(),
                        plainPassword);
                user.setPassword(passwordEncoder.encode(plainPassword));
                user.setPasswordResetRequired(true); // Force change on first login
            }

            if (roleObj != null) {
                user.setRole(roleObj);
            } else {
                throw new RuntimeException(
                        "Cannot create user account: Role '" + req.getRole() + "' not found in system.");
            }

            user = userRepository.save(user);
            emp.setUser(user);

            // Mapping for Partner: Multiple Companies
            if ("PARTNER".equals(req.getRole()) && req.getCompanyIds() != null) {
                userCompanyRepository.deleteByUser(user);
                for (UUID coId : req.getCompanyIds()) {
                    Company co = companyRepository.findById(coId).orElseThrow();
                    userCompanyRepository.save(UserCompany.builder().user(user).company(co).build());
                }
            } else if (!"ADMIN".equals(req.getRole()) && emp.getBranch() != null) {
                userCompanyRepository.deleteByUser(user);
                userCompanyRepository.save(UserCompany.builder()
                        .user(user)
                        .company(emp.getBranch().getCompany())
                        .branch(emp.getBranch())
                        .build());
            }
        }

        Employee saved = employeeRepository.save(emp);
        log.info("Employee saved successfully with ID: {}", saved.getId());
        return mapToResponse(saved);
    }

    public List<EmployeeResponse> getAllEmployees() {
        return employeeRepository.findAll().stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    @Transactional
    public void deleteEmployee(java.util.UUID id) {
        employeeRepository.deleteById(id);
    }
}
