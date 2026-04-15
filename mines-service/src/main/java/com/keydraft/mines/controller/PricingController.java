package com.keydraft.mines.controller;

import com.keydraft.mines.dto.ApiResponse;
import com.keydraft.mines.dto.PricingQuoteRequest;
import com.keydraft.mines.dto.PricingQuoteResponse;
import com.keydraft.mines.service.PricingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/pricing")
@RequiredArgsConstructor
public class PricingController {

    private final PricingService pricingService;

    @PostMapping("/calculate")
    public ResponseEntity<ApiResponse<PricingQuoteResponse>> calculatePricing(@Valid @RequestBody PricingQuoteRequest request) {
        PricingQuoteResponse quote = pricingService.calculateQuote(request);
        return ResponseEntity.ok(ApiResponse.success(quote, "Quote generated successfully"));
    }
}
