package com.keydraft.mines.controller;

import com.keydraft.mines.dto.ApiResponse;
import com.keydraft.mines.dto.CustomerRequest;
import com.keydraft.mines.dto.CustomerResponse;
import com.keydraft.mines.dto.PaginatedResponse;
import com.keydraft.mines.service.CustomerService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/customers")
@RequiredArgsConstructor
public class CustomerController {

    private final CustomerService customerService;

    @PostMapping("/upsert")
    public ResponseEntity<ApiResponse<CustomerResponse>> upsertCustomer(
            @RequestParam(required = false) UUID id,
            @RequestBody CustomerRequest request) {
        CustomerResponse response = customerService.upsertCustomer(id, request);
        return ResponseEntity.ok(ApiResponse.success(response, 
                id == null ? "Customer created successfully" : "Customer updated successfully"));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<PaginatedResponse<CustomerResponse>>> getAllCustomers(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) UUID companyId,
            @RequestParam(required = false) UUID branchId,
            @PageableDefault(size = 10) Pageable pageable) {
        PaginatedResponse<CustomerResponse> customers = customerService.getAllCustomers(search, companyId, branchId, pageable);
        return ResponseEntity.ok(ApiResponse.success(customers, "Customers fetched successfully"));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteCustomer(@PathVariable UUID id) {
        customerService.deleteCustomer(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Customer deleted successfully"));
    }
}
