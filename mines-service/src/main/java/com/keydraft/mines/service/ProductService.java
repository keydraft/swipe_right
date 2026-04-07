package com.keydraft.mines.service;

import com.keydraft.mines.dto.ProductRequest;
import com.keydraft.mines.dto.ProductResponse;
import com.keydraft.mines.entity.*;
import com.keydraft.mines.exception.ResourceNotFoundException;
import com.keydraft.mines.repository.BranchRepository;
import com.keydraft.mines.repository.CompanyRepository;
import com.keydraft.mines.repository.ProductPriceRepository;
import com.keydraft.mines.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProductService {

    private final ProductRepository productRepository;
    private final ProductPriceRepository productPriceRepository;
    private final CompanyRepository companyRepository;
    private final BranchRepository branchRepository;

    @Transactional
    public ProductResponse upsertProduct(UUID id, ProductRequest request) {
        Company company = companyRepository.findById(request.getCompanyId())
                .orElseThrow(() -> new ResourceNotFoundException("Company not found"));

        Product product;
        if (id != null) {
            product = productRepository.findById(id)
                    .orElseThrow(() -> new ResourceNotFoundException("Product not found"));
        } else {
            product = new Product();
        }

        product.setName(request.getName());
        product.setShortName(request.getShortName());
        product.setHsnCode(request.getHsnCode());
        product.setGstPercentage(request.getGstPercentage());
        product.setRmType(request.getRmType());
        product.setActive(request.isActive());
        product.setCompany(company);

        Product savedProduct = productRepository.save(product);

        // Delete existing prices and recreate
        if (id != null) {
            List<ProductPrice> existingPrices = productPriceRepository.findByProductId(id);
            productPriceRepository.deleteAll(existingPrices);
        }

        if (request.getPrices() != null) {
            List<ProductPrice> productPrices = request.getPrices().stream().map(pr -> {
                Branch branch = branchRepository.findById(pr.getBranchId())
                        .orElseThrow(() -> new ResourceNotFoundException("Branch not found"));
                return ProductPrice.builder()
                        .product(savedProduct)
                        .branch(branch)
                        .rate(pr.getRate())
                        .build();
            }).collect(Collectors.toList());
            productPriceRepository.saveAll(productPrices);
            savedProduct.setPrices(productPrices);
        }

        return mapToResponse(savedProduct);
    }

    public List<ProductResponse> getAllProducts() {
        return productRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<ProductResponse> getProductsByCompany(UUID companyId) {
        return productRepository.findByCompanyId(companyId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public void deleteProduct(UUID id) {
        Product product = productRepository.findById(id)
                        .orElseThrow(() -> new ResourceNotFoundException("Product not found"));
        productRepository.delete(product);
    }

    private ProductResponse mapToResponse(Product product) {
        List<ProductResponse.PriceResponse> prices = product.getPrices().stream()
                .map(pp -> ProductResponse.PriceResponse.builder()
                        .branchId(pp.getBranch().getId())
                        .branchName(pp.getBranch().getName())
                        .rate(pp.getRate())
                        .build())
                .collect(Collectors.toList());

        return ProductResponse.builder()
                .id(product.getId())
                .name(product.getName())
                .shortName(product.getShortName())
                .hsnCode(product.getHsnCode())
                .gstPercentage(product.getGstPercentage())
                .rmType(product.getRmType())
                .active(product.isActive())
                .companyId(product.getCompany().getId())
                .companyName(product.getCompany().getName())
                .prices(prices)
                .build();
    }
}
