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

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;

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
                .active(em.isActive())
                .passbookFilePath(em.getPassbookFilePath())
                .aadhaarFilePath(em.getAadhaarFilePath())
                .panFilePath(em.getPanFilePath())
                .drivingLicenseFilePath(em.getDrivingLicenseFilePath());

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
        String lastCode = employeeRepository.findTopByOrderByEmployeeCodeDesc()
                .map(Employee::getEmployeeCode)
                .filter(code -> code.startsWith("E"))
                .orElse("E00000");

        try {
            int lastNum = Integer.parseInt(lastCode.substring(1));
            String newCode = String.format("E%05d", lastNum + 1);
            log.info("Generated Global Employee Code: {}", newCode);
            return newCode;
        } catch (Exception e) {
            long count = employeeRepository.count();
            String fallback = String.format("E%05d", count + 1);
            log.warn("Failed to parse last employee code {}, using count fallback: {}", lastCode, fallback);
            return fallback;
        }
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
            emp.setPassbookFilePath(fileStorageService.storeFile(passbook, "employees"));
        if (aadhaar != null)
            emp.setAadhaarFilePath(fileStorageService.storeFile(aadhaar, "employees"));
        if (pan != null)
            emp.setPanFilePath(fileStorageService.storeFile(pan, "employees"));
        if (dl != null)
            emp.setDrivingLicenseFilePath(fileStorageService.storeFile(dl, "employees"));

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
                List<UserCompany> existing = userCompanyRepository.findByUser(user);
                // Remove mappings not in the new list
                existing.stream()
                        .filter(uc -> !req.getCompanyIds().contains(uc.getCompany().getId()))
                        .forEach(userCompanyRepository::delete);
                // Add mappings that don't already exist
                for (UUID coId : req.getCompanyIds()) {
                    if (existing.stream().noneMatch(uc -> uc.getCompany().getId().equals(coId))) {
                        Company co = companyRepository.findById(coId).orElseThrow();
                        userCompanyRepository.save(UserCompany.builder().user(user).company(co).build());
                    }
                }
            } else if (!"ADMIN".equals(req.getRole()) && emp.getBranch() != null) {
                Company targetCo = emp.getBranch().getCompany();
                List<UserCompany> existing = userCompanyRepository.findByUser(user);

                UserCompany matchingUc = null;
                for (UserCompany uc : existing) {
                    if (uc.getCompany().getId().equals(targetCo.getId())) {
                        matchingUc = uc;
                    } else {
                        userCompanyRepository.delete(uc);
                    }
                }

                if (matchingUc != null) {
                    matchingUc.setBranch(emp.getBranch());
                    userCompanyRepository.save(matchingUc);
                } else {
                    userCompanyRepository.save(UserCompany.builder()
                            .user(user)
                            .company(targetCo)
                            .branch(emp.getBranch())
                            .build());
                }
            }
        }

        Employee saved = employeeRepository.save(emp);
        log.info("Employee saved successfully with ID: {}", saved.getId());
        return mapToResponse(saved);
    }

    public List<EmployeeResponse> getAllEmployeesList() {
        return employeeRepository.findAll().stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    public PaginatedResponse<EmployeeResponse> getAllEmployees(String search, Pageable pageable) {
        Specification<Employee> spec = (root, query, cb) -> {
            if (search == null || search.isEmpty()) {
                return cb.conjunction();
            }
            String pattern = "%" + search.toLowerCase() + "%";
            return cb.or(
                    cb.like(cb.lower(root.get("firstName")), pattern),
                    cb.like(cb.lower(root.get("lastName")), pattern),
                    cb.like(cb.lower(root.get("employeeCode")), pattern),
                    cb.like(cb.lower(root.get("contactNumber")), pattern),
                    cb.like(cb.lower(root.get("email")), pattern));
        };

        Page<Employee> page = employeeRepository.findAll(spec, pageable);
        List<EmployeeResponse> content = page.getContent().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());

        return PaginatedResponse.<EmployeeResponse>builder()
                .content(content)
                .pageNumber(page.getNumber())
                .pageSize(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .last(page.isLast())
                .build();
    }

    @Transactional
    public void deleteEmployee(java.util.UUID id) {
        employeeRepository.deleteById(id);
    }
}
