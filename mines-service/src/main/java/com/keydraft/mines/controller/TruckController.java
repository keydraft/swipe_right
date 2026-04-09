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

    @PostMapping(value = "/upsert", consumes = {"multipart/form-data"})
    public ResponseEntity<ApiResponse<TruckResponse>> upsertTruck(
            @RequestParam(required = false) UUID id,
            @RequestPart("truck") String truckJson,
            @RequestPart(value = "rcFront", required = false) org.springframework.web.multipart.MultipartFile rcFront,
            @RequestPart(value = "rcBack", required = false) org.springframework.web.multipart.MultipartFile rcBack,
            @RequestPart(value = "insurance", required = false) org.springframework.web.multipart.MultipartFile insurance,
            @RequestPart(value = "permit", required = false) org.springframework.web.multipart.MultipartFile permit,
            @RequestPart(value = "fc", required = false) org.springframework.web.multipart.MultipartFile fc) {
        
        try {
            com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
            mapper.registerModule(new com.fasterxml.jackson.datatype.jsr310.JavaTimeModule());
            TruckRequest request = mapper.readValue(truckJson, TruckRequest.class);
            
            TruckResponse response = truckService.upsertTruckWithFiles(id, request, rcFront, rcBack, insurance, permit, fc);
            return ResponseEntity.ok(ApiResponse.success(response, 
                    id == null ? "Truck created successfully" : "Truck updated successfully"));
        } catch (Exception e) {
            throw new RuntimeException("Failed to parse truck data", e);
        }
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
