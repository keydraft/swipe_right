package com.keydraft.mines.controller;

import com.keydraft.mines.dto.*;
import com.keydraft.mines.service.TransporterService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/transporters")
@RequiredArgsConstructor
public class TransporterController {

    private final TransporterService transporterService;

    @PostMapping("/upsert")
    public ResponseEntity<ApiResponse<TransporterResponse>> upsertTransporter(
            @RequestParam(required = false) UUID id,
            @RequestBody TransporterRequest request) {
        TransporterResponse response = transporterService.upsertTransporter(id, request);
        return ResponseEntity.ok(ApiResponse.success(response, 
                id == null ? "Transporter created successfully" : "Transporter updated successfully"));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<PaginatedResponse<TransporterResponse>>> getAllTransporters(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) UUID companyId,
            @RequestParam(required = false) UUID branchId,
            @PageableDefault(size = 10) Pageable pageable) {
        PaginatedResponse<TransporterResponse> transporters = transporterService.getAllTransporters(search, companyId, branchId, pageable);
        return ResponseEntity.ok(ApiResponse.success(transporters, "Transporters fetched successfully"));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteTransporter(@PathVariable UUID id) {
        transporterService.deleteTransporter(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Transporter deleted successfully"));
    }

    @PostMapping("/assign")
    public ResponseEntity<ApiResponse<TransporterAssignmentResponse>> assignToBranch(
            @RequestBody TransporterAssignmentRequest request) {
        TransporterAssignmentResponse response = transporterService.assignToBranch(request);
        return ResponseEntity.ok(ApiResponse.success(response, "Transporter assigned to branch successfully"));
    }

    @DeleteMapping("/assignments/{assignmentId}")
    public ResponseEntity<ApiResponse<Void>> removeAssignment(@PathVariable UUID assignmentId) {
        transporterService.removeAssignment(assignmentId);
        return ResponseEntity.ok(ApiResponse.success(null, "Assignment removed successfully"));
    }

    @GetMapping("/{transporterId}/assignments")
    public ResponseEntity<ApiResponse<List<TransporterAssignmentResponse>>> getAssignments(@PathVariable UUID transporterId) {
        List<TransporterAssignmentResponse> assignments = transporterService.getAssignments(transporterId);
        return ResponseEntity.ok(ApiResponse.success(assignments, "Assignments fetched successfully"));
    }

    @GetMapping("/branch/{branchId}")
    public ResponseEntity<ApiResponse<List<TransporterResponse>>> getTransportersForBranch(@PathVariable UUID branchId) {
        List<TransporterResponse> transporters = transporterService.getTransportersForBranch(branchId);
        return ResponseEntity.ok(ApiResponse.success(transporters, "Branch transporters fetched successfully"));
    }
}
