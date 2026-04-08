package com.keydraft.mines.service;

import com.keydraft.mines.dto.*;
import com.keydraft.mines.entity.*;
import com.keydraft.mines.repository.CustomerRepository;
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
public class CustomerService {

    private final CustomerRepository customerRepository;
    private final ProductRepository productRepository;

    @Transactional
    public CustomerResponse upsertCustomer(UUID id, CustomerRequest request) {
        Customer customer;
        if (id != null) {
            customer = customerRepository.findById(id).orElseThrow(() -> new RuntimeException("Customer not found"));
        } else {
            customer = new Customer();
        }

        customer.setName(request.getName());
        customer.setType(request.getType());
        customer.setPhone(request.getPhone());
        customer.setEmail(request.getEmail());
        customer.setGstin(request.getGstin());
        if (request.getActive() != null) customer.setActive(request.getActive());

        if (request.getAddress() != null) {
            customer.setAddress(Address.builder()
                    .addressLine1(request.getAddress().getAddressLine1())
                    .addressLine2(request.getAddress().getAddressLine2())
                    .district(request.getAddress().getDistrict())
                    .state(request.getAddress().getState())
                    .pincode(request.getAddress().getPincode())
                    .build());
        }

        // Handle direct prices (for LOCAL)
        customer.getPrices().clear();
        if (request.getPrices() != null) {
            for (CustomerPriceRequest priceReq : request.getPrices()) {
                Product product = productRepository.findById(priceReq.getProductId())
                        .orElseThrow(() -> new RuntimeException("Product not found: " + priceReq.getProductId()));
                customer.getPrices().add(mapToEntity(priceReq, product, customer, null));
            }
        }

        // Handle sites (for CORPORATE)
        customer.getSites().clear();
        if (request.getSites() != null) {
            for (CustomerSiteRequest siteReq : request.getSites()) {
                CustomerSite site = CustomerSite.builder()
                        .siteName(siteReq.getSiteName())
                        .customer(customer)
                        .phone(siteReq.getPhone())
                        .alternatePhone(siteReq.getAlternatePhone())
                        .driverSalary(siteReq.getDriverSalary())
                        .build();

                if (siteReq.getAddress() != null) {
                    site.setAddress(Address.builder()
                            .addressLine1(siteReq.getAddress().getAddressLine1())
                            .addressLine2(siteReq.getAddress().getAddressLine2())
                            .district(siteReq.getAddress().getDistrict())
                            .state(siteReq.getAddress().getState())
                            .pincode(siteReq.getAddress().getPincode())
                            .build());
                }

                if (siteReq.getPrices() != null) {
                    for (CustomerPriceRequest priceReq : siteReq.getPrices()) {
                        Product product = productRepository.findById(priceReq.getProductId())
                                .orElseThrow(() -> new RuntimeException("Product not found: " + priceReq.getProductId()));
                        site.getPrices().add(mapToEntity(priceReq, product, customer, site));
                    }
                }
                customer.getSites().add(site);
            }
        }

        Customer saved = customerRepository.save(customer);
        return mapToResponse(saved);
    }

    private CustomerPrice mapToEntity(CustomerPriceRequest req, Product product, Customer customer, CustomerSite site) {
        return CustomerPrice.builder()
                .customer(customer)
                .site(site)
                .product(product)
                .rate(req.getRate())
                .cashRate(req.getCashRate())
                .creditRate(req.getCreditRate())
                .transportRate(req.getTransportRate())
                .uom(req.getUom())
                .tonnageLimit(req.getTonnageLimit())
                .gstInclusive(req.getGstInclusive() != null ? req.getGstInclusive() : false)
                .build();
    }

    public List<CustomerResponse> getAllCustomersList() {
        return customerRepository.findAll().stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    public PaginatedResponse<CustomerResponse> getAllCustomers(String search, Pageable pageable) {
        Specification<Customer> spec = (root, query, cb) -> {
            if (search == null || search.isEmpty()) {
                return cb.conjunction();
            }
            String pattern = "%" + search.toLowerCase() + "%";
            return cb.or(
                    cb.like(cb.lower(root.get("name")), pattern),
                    cb.like(cb.lower(root.get("phone")), pattern),
                    cb.like(cb.lower(root.get("email")), pattern)
            );
        };

        Page<Customer> page = customerRepository.findAll(spec, pageable);
        List<CustomerResponse> content = page.getContent().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());

        return PaginatedResponse.<CustomerResponse>builder()
                .content(content)
                .pageNumber(page.getNumber())
                .pageSize(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .last(page.isLast())
                .build();
    }

    public void deleteCustomer(UUID id) {
        customerRepository.deleteById(id);
    }

    private CustomerResponse mapToResponse(Customer c) {
        return CustomerResponse.builder()
                .id(c.getId())
                .name(c.getName())
                .type(c.getType())
                .phone(c.getPhone())
                .email(c.getEmail())
                .gstin(c.getGstin())
                .active(c.isActive())
                .address(c.getAddress() != null ? AddressResponse.builder()
                        .addressLine1(c.getAddress().getAddressLine1())
                        .addressLine2(c.getAddress().getAddressLine2())
                        .district(c.getAddress().getDistrict())
                        .state(c.getAddress().getState())
                        .pincode(c.getAddress().getPincode())
                        .build() : null)
                .prices(c.getPrices().stream().map(this::mapPriceToResponse).collect(Collectors.toList()))
                .sites(c.getSites().stream().map(s -> CustomerSiteResponse.builder()
                        .id(s.getId())
                        .siteName(s.getSiteName())
                        .phone(s.getPhone())
                        .alternatePhone(s.getAlternatePhone())
                        .driverSalary(s.getDriverSalary())
                        .address(s.getAddress() != null ? AddressResponse.builder()
                                .addressLine1(s.getAddress().getAddressLine1())
                                .addressLine2(s.getAddress().getAddressLine2())
                                .district(s.getAddress().getDistrict())
                                .state(s.getAddress().getState())
                                .pincode(s.getAddress().getPincode())
                                .build() : null)
                        .prices(s.getPrices().stream().map(this::mapPriceToResponse).collect(Collectors.toList()))
                        .build()).collect(Collectors.toList()))
                .build();
    }

    private CustomerPriceResponse mapPriceToResponse(CustomerPrice p) {
        return CustomerPriceResponse.builder()
                .id(p.getId())
                .productId(p.getProduct().getId())
                .productName(p.getProduct().getName())
                .rate(p.getRate())
                .cashRate(p.getCashRate())
                .creditRate(p.getCreditRate())
                .transportRate(p.getTransportRate())
                .uom(p.getUom())
                .tonnageLimit(p.getTonnageLimit())
                .gstInclusive(p.getGstInclusive())
                .build();
    }
}
