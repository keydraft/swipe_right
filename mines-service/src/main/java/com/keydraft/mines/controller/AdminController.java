package com.keydraft.mines.controller;

import com.keydraft.mines.dto.*;
import com.keydraft.mines.entity.User;
import com.keydraft.mines.service.AdminService;
import io.swagger.v3.oas.annotations.Operation;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final AdminService adminService;

    // ==================== COMPANY ====================

    @PostMapping("/upsert-company")
    public ResponseEntity<ApiResponse<CompanyResponse>> upsertCompany(@Valid @RequestBody CompanyRequest request) {
        CompanyResponse response = adminService.upsertCompany(request);
        return ResponseEntity.ok(ApiResponse.success(response, "Company processed successfully"));
    }

    @GetMapping("/companies")
    public ResponseEntity<ApiResponse<PaginatedResponse<CompanyResponse>>> getCompanies(
            @RequestParam(required = false) String search,
            @PageableDefault(size = 10) Pageable pageable) {
        PaginatedResponse<CompanyResponse> response = adminService.getAllCompanies(search, pageable);
        return ResponseEntity.ok(ApiResponse.success(response, "Companies fetched successfully"));
    }

    @DeleteMapping("/delete-company/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteCompany(@PathVariable java.util.UUID id) {
        adminService.deleteCompany(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Company deleted successfully"));
    }

    // ==================== USER ====================
 
    @PostMapping("/create-user")
    public ResponseEntity<ApiResponse<UserResponse>> createUser(
            @Valid @RequestBody UserCreateRequest request,
            @AuthenticationPrincipal User currentUser) {
        UserResponse response = adminService.createUser(request, currentUser);
        return ResponseEntity.ok(ApiResponse.success(response, "User created successfully"));
    }
 
    @GetMapping("/users")
    public ResponseEntity<ApiResponse<List<UserResponse>>> getAllUsers() {
        List<UserResponse> response = adminService.getAllUsers();
        return ResponseEntity.ok(ApiResponse.success(response, "Users fetched successfully"));
    }
 
    @PostMapping("/link-partner")
    public ResponseEntity<ApiResponse<UserResponse>> linkPartner(@Valid @RequestBody PartnerLinkRequest request) {
        UserResponse response = adminService.linkPartnerToCompany(request);
        return ResponseEntity.ok(ApiResponse.success(response, "Partner linked to company successfully"));
    }

    @PostMapping("/unlink-partner")
    public ResponseEntity<ApiResponse<Void>> unlinkPartner(@Valid @RequestBody PartnerLinkRequest request) {
        adminService.unlinkPartnerFromCompany(request);
        return ResponseEntity.ok(ApiResponse.success(null, "Partner unlinked from company successfully"));
    }

    // ==================== ROLE ====================

    @Operation(summary = "Get all roles")
    @GetMapping("/roles")
    public ResponseEntity<ApiResponse<List<RoleResponse>>> getRoles() {
        List<RoleResponse> response = adminService.getAllRoles();
        return ResponseEntity.ok(ApiResponse.success(response, "Roles fetched successfully"));
    }

    @Operation(summary = "Seed default system roles (ADMIN, PARTNER, MANAGER, etc.)")
    @PostMapping("/seed-roles")
    public ResponseEntity<ApiResponse<List<RoleResponse>>> seedRoles() {
        List<RoleResponse> response = adminService.seedDefaultRoles();
        return ResponseEntity.ok(ApiResponse.success(response, "System roles seeded successfully"));
    }

    @GetMapping("/companies/{companyId}/branches")
    public ResponseEntity<ApiResponse<List<BranchResponse>>> getBranches(@PathVariable java.util.UUID companyId) {
        List<BranchResponse> response = adminService.getBranchesByCompany(companyId);
        return ResponseEntity.ok(ApiResponse.success(response, "Branches fetched successfully"));
    }
}
