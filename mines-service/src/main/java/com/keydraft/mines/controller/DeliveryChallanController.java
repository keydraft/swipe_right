package com.keydraft.mines.controller;

import com.keydraft.mines.dto.*;
import com.keydraft.mines.service.DeliveryChallanService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/delivery-challans")
@RequiredArgsConstructor
@Tag(name = "Delivery Challan", description = "POS & Credit DC operations")
public class DeliveryChallanController {

    private final DeliveryChallanService dcService;

    // ─── CREATE (Step 1: Tare entry) ────────────────────────

    @Operation(summary = "Create a new Delivery Challan (tare weight entry)")
    @PostMapping
    public ResponseEntity<ApiResponse<DeliveryChallanResponse>> createDc(
            @Valid @RequestBody DeliveryChallanRequest request) {
        DeliveryChallanResponse response = dcService.createDc(request);
        return ResponseEntity.ok(ApiResponse.success(response, "DC created successfully"));
    }

    // ─── COMPLETE (Step 2: Gross weight + payment) ──────────

    @Operation(summary = "Complete DC with gross weight and payment")
    @PutMapping("/{id}/complete")
    public ResponseEntity<ApiResponse<DeliveryChallanResponse>> completeDc(
            @PathVariable UUID id,
            @Valid @RequestBody DeliveryChallanRequest request) {
        DeliveryChallanResponse response = dcService.completeDc(id, request);
        return ResponseEntity.ok(ApiResponse.success(response, "DC completed successfully"));
    }

    // ─── GET BY ID ──────────────────────────────────────────

    @Operation(summary = "Get DC by ID")
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<DeliveryChallanResponse>> getDcById(@PathVariable UUID id) {
        DeliveryChallanResponse response = dcService.getDcById(id);
        return ResponseEntity.ok(ApiResponse.success(response, "DC fetched"));
    }

    // ─── LIST (paginated, filtered) ─────────────────────────

    @Operation(summary = "List delivery challans with filters")
    @GetMapping
    public ResponseEntity<ApiResponse<PaginatedResponse<DeliveryChallanResponse>>> listDcs(
            @RequestParam(required = false) UUID companyId,
            @RequestParam(required = false) UUID branchId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String search,
            @PageableDefault(size = 20) Pageable pageable) {
        PaginatedResponse<DeliveryChallanResponse> response =
                dcService.listDcs(companyId, branchId, status, search, pageable);
        return ResponseEntity.ok(ApiResponse.success(response, "DCs fetched"));
    }

    // ─── PAY LATER: Search unpaid DCs ───────────────────────

    @Operation(summary = "Search unpaid DCs by vehicle number")
    @GetMapping("/unpaid/vehicle/{vehicleNo}")
    public ResponseEntity<ApiResponse<List<DeliveryChallanResponse>>> findUnpaidByVehicle(
            @PathVariable String vehicleNo) {
        List<DeliveryChallanResponse> response = dcService.findUnpaidByVehicle(vehicleNo);
        return ResponseEntity.ok(ApiResponse.success(response, "Unpaid DCs fetched"));
    }

    @Operation(summary = "Search unpaid DCs by customer ID")
    @GetMapping("/unpaid/customer/{customerId}")
    public ResponseEntity<ApiResponse<List<DeliveryChallanResponse>>> findUnpaidByCustomer(
            @PathVariable UUID customerId) {
        List<DeliveryChallanResponse> response = dcService.findUnpaidByCustomer(customerId);
        return ResponseEntity.ok(ApiResponse.success(response, "Unpaid DCs fetched"));
    }

    @Operation(summary = "Search unpaid DCs by guest name")
    @GetMapping("/unpaid/guest")
    public ResponseEntity<ApiResponse<List<DeliveryChallanResponse>>> findUnpaidByGuestName(
            @RequestParam String name) {
        List<DeliveryChallanResponse> response = dcService.findUnpaidByGuestName(name);
        return ResponseEntity.ok(ApiResponse.success(response, "Unpaid DCs fetched"));
    }

    // ─── PAY LATER: Settle payment ──────────────────────────

    @Operation(summary = "Settle payment for an unpaid DC")
    @PutMapping("/{id}/settle")
    public ResponseEntity<ApiResponse<DeliveryChallanResponse>> settlePayment(
            @PathVariable UUID id,
            @RequestBody Map<String, Object> body) {
        String paymentMethod = (String) body.get("paymentMethod");
        BigDecimal amount = new BigDecimal(body.get("amount").toString());
        DeliveryChallanResponse response = dcService.settlePayment(id, paymentMethod, amount);
        return ResponseEntity.ok(ApiResponse.success(response, "Payment settled"));
    }

    // ─── OUTSTANDING CHECK ──────────────────────────────────

    @Operation(summary = "Check outstanding amount for a vehicle")
    @GetMapping("/outstanding/{vehicleNo}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> checkOutstanding(
            @PathVariable String vehicleNo) {
        BigDecimal outstanding = dcService.getOutstandingByVehicle(vehicleNo);
        Map<String, Object> data = Map.of(
                "vehicleNo", vehicleNo.toUpperCase(),
                "outstandingAmount", outstanding,
                "hasOutstanding", outstanding.compareTo(BigDecimal.ZERO) > 0
        );
        return ResponseEntity.ok(ApiResponse.success(data, "Outstanding check complete"));
    }
}
