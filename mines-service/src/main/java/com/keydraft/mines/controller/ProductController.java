package com.keydraft.mines.controller;

import com.keydraft.mines.dto.ApiResponse;
import com.keydraft.mines.dto.ProductRequest;
import com.keydraft.mines.dto.ProductResponse;
import com.keydraft.mines.service.ProductService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
public class ProductController {

    private final ProductService productService;

    @PostMapping("/upsert")
    public ResponseEntity<ApiResponse<ProductResponse>> upsertProduct(
            @RequestParam(required = false) UUID id,
            @RequestBody ProductRequest request) {
        ProductResponse response = productService.upsertProduct(id, request);
        return ResponseEntity.ok(ApiResponse.success(response, 
                id == null ? "Product created successfully" : "Product updated successfully"));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<ProductResponse>>> getAllProducts() {
        List<ProductResponse> products = productService.getAllProducts();
        return ResponseEntity.ok(ApiResponse.success(products, "Products fetched successfully"));
    }

    @GetMapping("/company/{companyId}")
    public ResponseEntity<ApiResponse<List<ProductResponse>>> getProductsByCompany(@PathVariable UUID companyId) {
        List<ProductResponse> products = productService.getProductsByCompany(companyId);
        return ResponseEntity.ok(ApiResponse.success(products, "Products fetched for company successfully"));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteProduct(@PathVariable UUID id) {
        productService.deleteProduct(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Product deleted successfully"));
    }
}
