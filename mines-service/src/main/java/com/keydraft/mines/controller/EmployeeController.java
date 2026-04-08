package com.keydraft.mines.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.keydraft.mines.dto.ApiResponse;
import com.keydraft.mines.dto.EmployeeRequest;
import com.keydraft.mines.dto.EmployeeResponse;
import com.keydraft.mines.service.EmployeeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/employees")
@RequiredArgsConstructor
public class EmployeeController {

    private final EmployeeService employeeService;
    private final ObjectMapper objectMapper;

    @PostMapping(value = "/upsert", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<EmployeeResponse>> upsertEmployee(
            @RequestPart("employee") String employeeJson,
            @RequestPart(value = "passbook", required = false) MultipartFile passbook,
            @RequestPart(value = "aadhaar", required = false) MultipartFile aadhaar,
            @RequestPart(value = "pan", required = false) MultipartFile pan,
            @RequestPart(value = "drivingLicense", required = false) MultipartFile drivingLicense
    ) throws Exception {
        
        objectMapper.configure(com.fasterxml.jackson.databind.DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
        EmployeeRequest request = objectMapper.readValue(employeeJson, EmployeeRequest.class);

        // Store files and set paths in service call
        EmployeeResponse response = employeeService.upsertEmployeeWithFiles(request, passbook, aadhaar, pan, drivingLicense);
        
        return ResponseEntity.ok(ApiResponse.success(response, "Employee profile with documents processed successfully"));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<EmployeeResponse>>> getAllEmployees() {
        return ResponseEntity.ok(ApiResponse.success(employeeService.getAllEmployees(), "Employees fetched successfully"));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteEmployee(@PathVariable UUID id) {
        employeeService.deleteEmployee(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Employee deleted successfully"));
    }
}
