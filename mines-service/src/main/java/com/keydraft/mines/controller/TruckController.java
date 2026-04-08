package com.keydraft.mines.controller;

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

import java.util.UUID;

@RestController
@RequestMapping("/api/trucks")
@RequiredArgsConstructor
public class TruckController {

    private final TruckService truckService;

    @PostMapping("/upsert")
    public ResponseEntity<ApiResponse<TruckResponse>> upsertTruck(
            @RequestParam(required = false) UUID id,
            @RequestBody TruckRequest request) {
        TruckResponse response = truckService.upsertTruck(id, request);
        return ResponseEntity.ok(ApiResponse.success(response, 
                id == null ? "Truck created successfully" : "Truck updated successfully"));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<PaginatedResponse<TruckResponse>>> getAllTrucks(
            @RequestParam(required = false) String search,
            @PageableDefault(size = 10) Pageable pageable) {
        PaginatedResponse<TruckResponse> trucks = truckService.getAllTrucks(search, pageable);
        return ResponseEntity.ok(ApiResponse.success(trucks, "Trucks fetched successfully"));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteTruck(@PathVariable UUID id) {
        truckService.deleteTruck(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Truck deleted successfully"));
    }
}
