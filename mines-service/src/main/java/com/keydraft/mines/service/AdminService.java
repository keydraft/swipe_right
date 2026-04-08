package com.keydraft.mines.service;

import com.keydraft.mines.dto.*;
import com.keydraft.mines.entity.*;
import com.keydraft.mines.entity.enums.BranchType;
import com.keydraft.mines.entity.enums.SiteType;
import com.keydraft.mines.event.AuditEvent;
import com.keydraft.mines.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdminService {

    private final CompanyRepository companyRepository;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final UserCompanyRepository userCompanyRepository;
    private final BranchRepository branchRepository;
    private final PasswordEncoder passwordEncoder;
    private final ApplicationEventPublisher eventPublisher;
    private final PermissionRepository permissionRepository;

    // ==================== MAPPING HELPERS ====================

    private Address mapAddress(AddressRequest request) {
        if (request == null) return null;
        return Address.builder()
                .addressLine1(request.getAddressLine1())
                .addressLine2(request.getAddressLine2())
                .district(request.getDistrict())
                .state(request.getState())
                .pincode(request.getPincode())
                .build();
    }

    private AddressResponse mapAddressResponse(Address address) {
        if (address == null) return null;
        return AddressResponse.builder()
                .addressLine1(address.getAddressLine1())
                .addressLine2(address.getAddressLine2())
                .district(address.getDistrict())
                .state(address.getState())
                .pincode(address.getPincode())
                .build();
    }

    private BankAccountResponse mapBankResponse(BankAccount bank) {
        return BankAccountResponse.builder()
                .id(bank.getId())
                .accountName(bank.getAccountName())
                .shortName(bank.getShortName())
                .accountNumber(bank.getAccountNumber())
                .bankName(bank.getBankName())
                .branchName(bank.getBranchName())
                .ifscCode(bank.getIfscCode())
                .openingBalance(bank.getOpeningBalance())
                .openingDate(bank.getOpeningDate())
                .build();
    }

    private BranchResponse mapBranchResponse(Branch branch) {
        return BranchResponse.builder()
                .id(branch.getId())
                .name(branch.getName())
                .siteType(branch.getSiteType().name())
                .branchType(branch.getBranchType().name())
                .phone(branch.getPhone())
                .alternatePhoneNo(branch.getAlternatePhoneNo())
                .emailId(branch.getEmailId())
                .address(mapAddressResponse(branch.getAddress()))
                .build();
    }

    private CompanyResponse mapCompanyResponse(Company company) {
        return CompanyResponse.builder()
                .id(company.getId())
                .name(company.getName())
                .address(mapAddressResponse(company.getAddress()))
                .phone(company.getPhone())
                .alternatePhoneNo(company.getAlternatePhoneNo())
                .emailId(company.getEmailId())
                .invoiceInitial(company.getInvoiceInitial())
                .gstin(company.getGstin())
                .active(company.isActive())
                .bankAccounts(company.getBankAccounts().stream()
                        .map(this::mapBankResponse)
                        .collect(Collectors.toList()))
                .branches(company.getBranches().stream()
                        .map(this::mapBranchResponse)
                        .collect(Collectors.toList()))
                .build();
    }

    private UserResponse mapUserResponse(User user) {
        List<UserResponse.UserCompanyInfo> companyInfos = userCompanyRepository.findByUser(user)
                .stream()
                .map(uc -> UserResponse.UserCompanyInfo.builder()
                        .companyId(uc.getCompany().getId())
                        .companyName(uc.getCompany().getName())
                        .branchId(uc.getBranch() != null ? uc.getBranch().getId() : null)
                        .branchName(uc.getBranch() != null ? uc.getBranch().getName() : null)
                        .build())
                .collect(Collectors.toList());

        return UserResponse.builder()
                .id(user.getId()).username(user.getUsername()).roleName(user.getRole().getName()).enabled(user.isEnabled()).companies(companyInfos).build();
    }

    private RoleResponse mapRoleResponse(Role role) {
        return RoleResponse.builder()
                .id(role.getId())
                .name(role.getName())
                .rank(role.getRank())
                .permissions(role.getPermissions().stream().map(Permission::getName).collect(Collectors.toList()))
                .build();
    }

    // ==================== COMPANY OPERATIONS ====================

    @Transactional
    public CompanyResponse upsertCompany(CompanyRequest request) {
        Company company;
        boolean isUpdate = request.getId() != null;
        if (isUpdate) {
            company = companyRepository.findById(request.getId()).orElseThrow(() -> new RuntimeException("No Company"));
        } else {
            if (companyRepository.findByName(request.getName()).isPresent()) throw new RuntimeException("Company name exists");
            company = new Company();
        }

        company.setName(request.getName());
        company.setAddress(mapAddress(request.getAddress()));
        company.setPhone(request.getPhone());
        company.setAlternatePhoneNo(request.getAlternatePhoneNo());
        company.setEmailId(request.getEmailId());
        company.setGstin(request.getGstin());
        company.setInvoiceInitial(request.getInvoiceInitial());

        company = companyRepository.save(company);

        // Map Bank Accounts
        if (request.getBankAccounts() != null) {
            company.getBankAccounts().clear();
            for (BankAccountRequest br : request.getBankAccounts()) {
                BankAccount bank = BankAccount.builder()
                        .accountName(br.getAccountName())
                        .shortName(br.getShortName())
                        .accountNumber(br.getAccountNumber())
                        .bankName(br.getBankName())
                        .branchName(br.getBranchName())
                        .ifscCode(br.getIfscCode())
                        .openingBalance(br.getOpeningBalance())
                        .openingDate(br.getOpeningDate())
                        .company(company)
                        .build();
                company.getBankAccounts().add(bank);
            }
        }

        // Map Branches
        if (request.getBranches() != null && !request.getBranches().isEmpty()) {
            company.getBranches().clear();
            for (BranchRequest branchReq : request.getBranches()) {
                Branch branch = Branch.builder()
                        .name(branchReq.getName())
                        .siteType(SiteType.valueOf(branchReq.getSiteType().toUpperCase()))
                        .branchType(BranchType.valueOf(branchReq.getBranchType().toUpperCase()))
                        .phone(branchReq.getPhone())
                        .alternatePhoneNo(branchReq.getAlternatePhoneNo())
                        .emailId(branchReq.getEmailId())
                        .address(branchReq.getAddress() != null ? mapAddress(branchReq.getAddress()) : mapAddress(request.getAddress()))
                        .company(company)
                        .build();
                company.getBranches().add(branch);
            }
        } else if (!isUpdate) {
            throw new RuntimeException("At least one branch is required");
        }

        eventPublisher.publishEvent(new AuditEvent("SYSTEM", isUpdate ? "UPDATE_COMPANY" : "CREATE_COMPANY", "Company " + company.getName() + " processed.", null));
        
        return mapCompanyResponse(companyRepository.save(company));
    }

    @Transactional
    public void deleteCompany(java.util.UUID id) {
        Company company = companyRepository.findById(id).orElseThrow(() -> new RuntimeException("No Company"));
        companyRepository.delete(company);
        eventPublisher.publishEvent(new AuditEvent("SYSTEM", "DELETE_COMPANY", "Company " + company.getName() + " deleted.", null));
    }

    // ==================== PARTNER LINKING ====================

    @Transactional
    public UserResponse linkPartnerToCompany(PartnerLinkRequest request) {
        User user = userRepository.findByUsername(request.getUsername()).orElseThrow();
        Company company = companyRepository.findById(request.getCompanyId()).orElseThrow();
        if (userCompanyRepository.findByUserAndCompany(user, company).isPresent()) throw new RuntimeException("Already linked");
        userCompanyRepository.save(UserCompany.builder().user(user).company(company).branch(null).build());
        return mapUserResponse(user);
    }

    @Transactional
    public void unlinkPartnerFromCompany(PartnerLinkRequest request) {
        User user = userRepository.findByUsername(request.getUsername()).orElseThrow();
        Company company = companyRepository.findById(request.getCompanyId()).orElseThrow();
        UserCompany link = userCompanyRepository.findByUserAndCompany(user, company).orElseThrow();
        userCompanyRepository.delete(link);
    }

    // ==================== USER OPERATIONS ====================

    @Transactional
    public UserResponse createUser(UserCreateRequest request, User currentUser) {
        String roleName = request.getRoleName().toUpperCase();
        Role role = roleRepository.findByName(roleName).orElseGet(() -> roleRepository.save(Role.builder().name(roleName).build()));
        User newUser = User.builder().username(request.getUsername()).password(passwordEncoder.encode(request.getPassword())).role(role).enabled(true).build();
        newUser = userRepository.save(newUser);
        
        if (roleName.equals("PARTNER")) {
            for (java.util.UUID coId : request.getCompanyIds()) {
                Company co = companyRepository.findById(coId).orElseThrow();
                userCompanyRepository.save(UserCompany.builder().user(newUser).company(co).build());
            }
        } else if (!roleName.equals("ADMIN")) {
            Company co = companyRepository.findById(request.getCompanyId()).orElseThrow();
            Branch br = branchRepository.findById(request.getBranchId()).orElseThrow();
            
            if ("MANAGER".equals(roleName)) {
                if (userCompanyRepository.existsByBranchIdAndUser_Role_Name(br.getId(), "MANAGER")) {
                    throw new RuntimeException("A Manager already exists for this branch.");
                }
            }

            userCompanyRepository.save(UserCompany.builder().user(newUser).company(co).branch(br).build());
        }

        eventPublisher.publishEvent(new AuditEvent(currentUser.getUsername(), "CREATE_USER", "User " + newUser.getUsername() + " created.", null));
        return mapUserResponse(newUser);
    }

    public List<CompanyResponse> getCompaniesForUser(User user) {
        if (user.getRole().getName().equals("ADMIN")) return companyRepository.findAll().stream().map(this::mapCompanyResponse).collect(Collectors.toList());
        return userCompanyRepository.findByUser(user).stream().map(UserCompany::getCompany).distinct().map(this::mapCompanyResponse).collect(Collectors.toList());
    }

    public PaginatedResponse<CompanyResponse> getAllCompanies(String search, Pageable pageable) {
        Specification<Company> spec = (root, query, cb) -> {
            if (search == null || search.isEmpty()) {
                return cb.conjunction();
            }
            String pattern = "%" + search.toLowerCase() + "%";
            return cb.or(
                    cb.like(cb.lower(root.get("name")), pattern),
                    cb.like(cb.lower(root.get("gstin")), pattern),
                    cb.like(cb.lower(root.get("emailId")), pattern),
                    cb.like(cb.lower(root.get("phone")), pattern)
            );
        };

        Page<Company> page = companyRepository.findAll(spec, pageable);
        List<CompanyResponse> content = page.getContent().stream()
                .map(this::mapCompanyResponse)
                .collect(Collectors.toList());

        return PaginatedResponse.<CompanyResponse>builder()
                .content(content)
                .pageNumber(page.getNumber())
                .pageSize(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .last(page.isLast())
                .build();
    }

    public List<UserResponse> getAllUsers() { return userRepository.findAll().stream().map(this::mapUserResponse).collect(Collectors.toList()); }
    public List<RoleResponse> getAllRoles() { return roleRepository.findAll().stream().map(this::mapRoleResponse).collect(Collectors.toList()); }

    @Transactional
    public List<RoleResponse> seedDefaultRoles() {
        // 1. Define standard permissions
        String[][] permissionData = {
            {"READ_COMPANY", "Can view company details"},
            {"WRITE_COMPANY", "Can create/update companies"},
            {"DELETE_COMPANY", "Can delete companies"},
            {"READ_USER", "Can view user accounts"},
            {"WRITE_USER", "Can create/update user accounts"},
            {"READ_EMPLOYEE", "Can view employee data"},
            {"WRITE_EMPLOYEE", "Can manage employees"},
            {"READ_PRODUCT", "Can view master product list"},
            {"WRITE_PRODUCT", "Can manage products"},
            {"READ_CUSTOMER", "Can view customer profiles"},
            {"READ_POS", "Can access point of sale"},
            {"WRITE_POS", "Can perform billing and coupon issuance"},
            {"READ_BILLING", "Can view billing and coupon records"},
            {"READ_DASHBOARD", "Can view the main dashboard"}
        };

        java.util.Map<String, Permission> permMap = new java.util.HashMap<>();
        for (String[] p : permissionData) {
            Permission perm = permissionRepository.findByName(p[0])
                .orElseGet(() -> permissionRepository.save(Permission.builder().name(p[0]).description(p[1]).build()));
            permMap.put(p[0], perm);
        }

        // 2. Define roles and their associated permissions
        String[] ns = { "ADMIN", "PARTNER", "MANAGER", "ACCOUNTANT", "SITEOPERATOR", "WEIGHMENT_OPERATOR" };
        int[] ranks = { 0, 1, 2, 3, 4, 5 };
        
        java.util.List<RoleResponse> res = new java.util.ArrayList<>();
        for (int i = 0; i < ns.length; i++) {
            final String name = ns[i];
            final int rank = ranks[i];
            
            Role r = roleRepository.findByName(name).orElseGet(() -> roleRepository.save(Role.builder().name(name).rank(rank).build()));
            if (r.getRank() != rank) {
                r.setRank(rank);
            }

            // Assign permissions to roles
            java.util.Set<Permission> perms = r.getPermissions();
            perms.clear(); // Refresh permissions alignment
            
            // Everyone can see the Dashboard
            perms.add(permMap.get("READ_DASHBOARD"));

            if (name.equals("ADMIN")) {
                perms.addAll(permMap.values());
            } else if (name.equals("MANAGER") || name.equals("PARTNER")) {
                perms.add(permMap.get("READ_COMPANY"));
                perms.add(permMap.get("WRITE_COMPANY"));
                perms.add(permMap.get("READ_USER"));
                perms.add(permMap.get("READ_EMPLOYEE"));
                perms.add(permMap.get("WRITE_EMPLOYEE"));
                perms.add(permMap.get("READ_PRODUCT"));
                perms.add(permMap.get("WRITE_PRODUCT"));
                perms.add(permMap.get("READ_CUSTOMER"));
                perms.add(permMap.get("READ_POS"));
                perms.add(permMap.get("WRITE_POS"));
            } else if (name.equals("ACCOUNTANT")) {
                perms.add(permMap.get("READ_COMPANY"));
                perms.add(permMap.get("READ_CUSTOMER"));
                perms.add(permMap.get("READ_BILLING")); // If you have this permission defined
            } else if (name.equals("SITEOPERATOR") || name.equals("WEIGHMENT_OPERATOR")) {
                perms.add(permMap.get("READ_COMPANY"));
                perms.add(permMap.get("READ_PRODUCT"));
                perms.add(permMap.get("READ_POS"));
                perms.add(permMap.get("WRITE_POS"));
            }
            
            r = roleRepository.save(r);
            res.add(mapRoleResponse(r));
        }
        return res;
    }
}
