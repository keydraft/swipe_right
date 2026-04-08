package com.keydraft.mines.controller;

import com.keydraft.mines.dto.ApiResponse;
import com.keydraft.mines.dto.PaginatedResponse;
import com.keydraft.mines.dto.TransporterRequest;
import com.keydraft.mines.dto.TransporterResponse;
import com.keydraft.mines.service.TransporterService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

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
            @PageableDefault(size = 10) Pageable pageable) {
        PaginatedResponse<TransporterResponse> transporters = transporterService.getAllTransporters(search, pageable);
        return ResponseEntity.ok(ApiResponse.success(transporters, "Transporters fetched successfully"));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteTransporter(@PathVariable UUID id) {
        transporterService.deleteTransporter(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Transporter deleted successfully"));
    }
}
