package com.keydraft.mines.controller;

import com.keydraft.mines.dto.ApiResponse;
import com.keydraft.mines.dto.InvoiceRequest;
import com.keydraft.mines.dto.InvoiceResponse;
import com.keydraft.mines.service.InvoiceService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/invoices")
@RequiredArgsConstructor
public class InvoiceController {

    private final InvoiceService invoiceService;

    @PostMapping("/compile")
    public ResponseEntity<ApiResponse<InvoiceResponse>> compileInvoice(@RequestBody InvoiceRequest request) {
        InvoiceResponse response = invoiceService.compileInvoice(request);
        return ResponseEntity.ok(ApiResponse.success(response, "Invoice compiled successfully"));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<InvoiceResponse>>> getAllInvoices() {
        return ResponseEntity.ok(ApiResponse.success(invoiceService.getAllInvoices(), "Invoices fetched"));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<InvoiceResponse>> getInvoiceById(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(invoiceService.getInvoiceById(id), "Invoice details fetched"));
    }
}
