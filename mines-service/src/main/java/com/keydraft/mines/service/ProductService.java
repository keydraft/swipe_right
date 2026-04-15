package com.keydraft.mines.service;

import com.keydraft.mines.dto.PaginatedResponse;
import com.keydraft.mines.dto.ProductRequest;
import com.keydraft.mines.dto.ProductResponse;
import com.keydraft.mines.entity.*;
import com.keydraft.mines.exception.ResourceNotFoundException;
import com.keydraft.mines.repository.BranchRepository;
import com.keydraft.mines.repository.CompanyRepository;
import com.keydraft.mines.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProductService {

    private final ProductRepository productRepository;
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

        // Update prices collection
        if (request.getPrices() != null) {
            product.getPrices().clear();
            for (ProductRequest.PriceRequest pr : request.getPrices()) {
                Branch branch = branchRepository.findById(pr.getBranchId())
                        .orElseThrow(() -> new ResourceNotFoundException("Branch not found"));
                
                ProductPrice price = ProductPrice.builder()
                        .product(product)
                        .branch(branch)
                        .rate(pr.getRate())
                        .build();
                product.getPrices().add(price);
            }
        }

        Product savedProduct = productRepository.save(product);
        return mapToResponse(savedProduct);
    }

    public List<ProductResponse> getAllProductsList() {
        return productRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public PaginatedResponse<ProductResponse> getAllProducts(String search, UUID companyId, Pageable pageable) {
        Specification<Product> spec = (root, query, cb) -> {
            java.util.List<jakarta.persistence.criteria.Predicate> predicates = new java.util.ArrayList<>();

            if (search != null && !search.isEmpty()) {
                String pattern = "%" + search.toLowerCase() + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("name")), pattern),
                        cb.like(cb.lower(root.get("shortName")), pattern),
                        cb.like(cb.lower(root.get("hsnCode")), pattern)
                ));
            }

            if (companyId != null) {
                predicates.add(cb.equal(root.get("company").get("id"), companyId));
            }

            return cb.and(predicates.toArray(new jakarta.persistence.criteria.Predicate[0]));
        };

        Page<Product> page = productRepository.findAll(spec, pageable);
        List<ProductResponse> content = page.getContent().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());

        return PaginatedResponse.<ProductResponse>builder()
                .content(content)
                .pageNumber(page.getNumber())
                .pageSize(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .last(page.isLast())
                .build();
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
