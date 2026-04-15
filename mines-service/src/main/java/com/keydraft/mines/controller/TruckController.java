package com.keydraft.mines.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.keydraft.mines.dto.ApiResponse;
import com.keydraft.mines.dto.PaginatedResponse;
import com.keydraft.mines.dto.TruckRequest;
import com.keydraft.mines.dto.TruckResponse;
import com.keydraft.mines.service.TruckService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.UUID;

@RestController
@RequestMapping("/api/trucks")
@RequiredArgsConstructor
public class TruckController {

    private final TruckService truckService;

    @PostMapping(value = "/upsert", consumes = { "multipart/form-data" })
    public ResponseEntity<ApiResponse<TruckResponse>> upsertTruck(
            @RequestParam(required = false) UUID id,
            @RequestPart("truck") String truckJson,
            @RequestPart(value = "rcFront", required = false) MultipartFile rcFront,
            @RequestPart(value = "rcBack", required = false) MultipartFile rcBack,
            @RequestPart(value = "insurance", required = false) MultipartFile insurance,
            @RequestPart(value = "permit", required = false) MultipartFile permit,
            @RequestPart(value = "fc", required = false) MultipartFile fc) throws Exception {

        ObjectMapper mapper = new ObjectMapper();
        mapper.findAndRegisterModules(); // Support LocalDate
        TruckRequest request = mapper.readValue(truckJson, TruckRequest.class);

        TruckResponse response = truckService.upsertTruckWithFiles(id, request, rcFront, rcBack, insurance, permit, fc);
        return ResponseEntity.ok(ApiResponse.success(response,
                id == null ? "Truck created successfully" : "Truck updated successfully"));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<PaginatedResponse<TruckResponse>>> getAllTrucks(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) UUID companyId,
            @RequestParam(required = false) UUID branchId,
            @PageableDefault(size = 10) Pageable pageable) {
        PaginatedResponse<TruckResponse> trucks = truckService.getAllTrucks(search, companyId, branchId, pageable);
        return ResponseEntity.ok(ApiResponse.success(trucks, "Trucks fetched successfully"));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteTruck(@PathVariable UUID id) {
        truckService.deleteTruck(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Truck deleted successfully"));
    }

    @PostMapping("/assign")
    public ResponseEntity<ApiResponse<java.util.List<com.keydraft.mines.dto.TruckAssignmentResponse>>> assignToBranch(
            @RequestBody com.keydraft.mines.dto.TruckAssignmentRequest request) {
        return ResponseEntity.ok(ApiResponse.success(truckService.assignToBranch(request), "Truck linked to branches successfully"));
    }

    @DeleteMapping("/assignments/{id}")
    public ResponseEntity<ApiResponse<Void>> removeAssignment(@PathVariable UUID id) {
        truckService.removeAssignment(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Truck unlinked from branch successfully"));
    }

    @GetMapping("/branch/{branchId}")
    public ResponseEntity<ApiResponse<java.util.List<TruckResponse>>> getTrucksByBranch(@PathVariable UUID branchId) {
        return ResponseEntity.ok(ApiResponse.success(truckService.getTrucksForBranch(branchId), "Branch trucks fetched successfully"));
    }
}
