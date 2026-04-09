package com.keydraft.mines.service;

import com.keydraft.mines.dto.*;
import com.keydraft.mines.entity.Transporter;
import com.keydraft.mines.entity.Address;
import com.keydraft.mines.repository.TransporterRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class TransporterService {

    private final TransporterRepository transporterRepository;

    @Transactional
    public TransporterResponse upsertTransporter(UUID id, TransporterRequest request) {
        Transporter transporter;
        if (id != null) {
            transporter = transporterRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Transporter not found"));
        } else {
            transporter = new Transporter();
        }

        if (transporter.getICode() == null || transporter.getICode().isEmpty()) {
            if (request.getICode() != null && !request.getICode().isEmpty()) {
                transporter.setICode(request.getICode());
            } else {
                transporter.setICode(generateTransporterCode());
            }
        }

        transporter.setName(request.getName());
        transporter.setGstin(request.getGstin());
        transporter.setPhone(request.getPhone());

        if (request.getAddress() != null) {
            transporter.setAddress(Address.builder()
                    .addressLine1(request.getAddress().getAddressLine1())
                    .addressLine2(request.getAddress().getAddressLine2())
                    .district(request.getAddress().getDistrict())
                    .state(request.getAddress().getState())
                    .pincode(request.getAddress().getPincode())
                    .build());
        }

        Transporter saved = transporterRepository.save(transporter);
        return mapToResponse(saved);
    }

    public List<TransporterResponse> getAllTransportersList() {
        return transporterRepository.findAll().stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    public PaginatedResponse<TransporterResponse> getAllTransporters(String search, Pageable pageable) {
        Specification<Transporter> spec = (root, query, cb) -> {
            if (search == null || search.isEmpty()) {
                return cb.conjunction();
            }
            String pattern = "%" + search.toLowerCase() + "%";
            return cb.or(
                    cb.like(cb.lower(root.get("name")), pattern),
                    cb.like(cb.lower(root.get("iCode")), pattern),
                    cb.like(cb.lower(root.get("phone")), pattern));
        };

        Page<Transporter> page = transporterRepository.findAll(spec, pageable);
        List<TransporterResponse> content = page.getContent().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());

        return PaginatedResponse.<TransporterResponse>builder()
                .content(content)
                .pageNumber(page.getNumber())
                .pageSize(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .last(page.isLast())
                .build();
    }

    public void deleteTransporter(UUID id) {
        transporterRepository.deleteById(id);
    }

    private String generateTransporterCode() {
        String lastCode = transporterRepository.findTopByOrderByiCodeDesc()
                .map(Transporter::getICode)
                .filter(code -> code.startsWith("T"))
                .orElse("T00000");

        try {
            int lastNum = Integer.parseInt(lastCode.substring(1));
            String newCode = String.format("T%05d", lastNum + 1);
            log.info("Generated Global Transporter Code: {}", newCode);
            return newCode;
        } catch (Exception e) {
            long count = transporterRepository.count();
            String fallback = String.format("T%05d", count + 1);
            log.warn("Failed to parse last transporter code {}, using count fallback: {}", lastCode, fallback);
            return fallback;
        }
    }

    private TransporterResponse mapToResponse(Transporter t) {
        return TransporterResponse.builder()
                .id(t.getId())
                .iCode(t.getICode())
                .name(t.getName())
                .gstin(t.getGstin())
                .phone(t.getPhone())
                .address(t.getAddress() != null ? AddressResponse.builder()
                        .addressLine1(t.getAddress().getAddressLine1())
                        .addressLine2(t.getAddress().getAddressLine2())
                        .district(t.getAddress().getDistrict())
                        .state(t.getAddress().getState())
                        .pincode(t.getAddress().getPincode())
                        .build() : null)
                .build();
    }
}
