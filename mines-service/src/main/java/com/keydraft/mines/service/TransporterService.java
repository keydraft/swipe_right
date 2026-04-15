package com.keydraft.mines.service;

import com.keydraft.mines.dto.*;
import com.keydraft.mines.entity.*;
import com.keydraft.mines.repository.BranchRepository;
import com.keydraft.mines.repository.CompanyRepository;
import com.keydraft.mines.repository.TransporterRepository;
import com.keydraft.mines.repository.TransporterAssignmentRepository;
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
    private final TransporterAssignmentRepository assignmentRepository;
    private final CompanyRepository companyRepository;
    private final BranchRepository branchRepository;

    @Transactional
    public TransporterResponse upsertTransporter(UUID id, TransporterRequest request) {
        Transporter transporter;
        if (id != null) {
            transporter = transporterRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Transporter not found"));
        } else {
            transporter = new Transporter();
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

    @Transactional
    public TransporterAssignmentResponse assignToBranch(TransporterAssignmentRequest request) {
        if (assignmentRepository.existsByTransporterIdAndBranchId(request.getTransporterId(), request.getBranchId())) {
            throw new RuntimeException("Transporter already assigned to this branch");
        }

        Transporter transporter = transporterRepository.findById(request.getTransporterId())
                .orElseThrow(() -> new RuntimeException("Transporter not found"));
        Company company = companyRepository.findById(request.getCompanyId())
                .orElseThrow(() -> new RuntimeException("Company not found"));
        Branch branch = branchRepository.findById(request.getBranchId())
                .orElseThrow(() -> new RuntimeException("Branch not found"));

        TransporterAssignment assignment = TransporterAssignment.builder()
                .transporter(transporter)
                .company(company)
                .branch(branch)
                .build();

        TransporterAssignment saved = assignmentRepository.save(assignment);
        return mapToAssignmentResponse(saved);
    }

    @Transactional
    public void removeAssignment(UUID assignmentId) {
        assignmentRepository.deleteById(assignmentId);
    }

    public List<TransporterAssignmentResponse> getAssignments(UUID transporterId) {
        return assignmentRepository.findByTransporterId(transporterId).stream()
                .map(this::mapToAssignmentResponse)
                .collect(Collectors.toList());
    }

    public List<TransporterResponse> getTransportersForBranch(UUID branchId) {
        return assignmentRepository.findByBranchId(branchId).stream()
                .map(as -> mapToResponse(as.getTransporter()))
                .collect(Collectors.toList());
    }

    public List<TransporterResponse> getAllTransportersList() {
        return transporterRepository.findAll().stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    public PaginatedResponse<TransporterResponse> getAllTransporters(String search, UUID companyId, UUID branchId, Pageable pageable) {
        Specification<Transporter> spec = (root, query, cb) -> {
            java.util.List<jakarta.persistence.criteria.Predicate> predicates = new java.util.ArrayList<>();
            
            if (search != null && !search.isEmpty()) {
                String pattern = "%" + search.toLowerCase() + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("name")), pattern),
                        cb.like(cb.lower(root.get("iCode")), pattern),
                        cb.like(cb.lower(root.get("phone")), pattern)));
            }

            if (branchId != null) {
                // Check assignments for this branch
                jakarta.persistence.criteria.Subquery<UUID> subquery = query.subquery(UUID.class);
                jakarta.persistence.criteria.Root<TransporterAssignment> assignmentRoot = subquery.from(TransporterAssignment.class);
                subquery.select(assignmentRoot.get("transporter").get("id"))
                        .where(cb.equal(assignmentRoot.get("branch").get("id"), branchId));
                predicates.add(root.get("id").in(subquery));
            } else if (companyId != null) {
                // Check assignments for this company
                jakarta.persistence.criteria.Subquery<UUID> subquery = query.subquery(UUID.class);
                jakarta.persistence.criteria.Root<TransporterAssignment> assignmentRoot = subquery.from(TransporterAssignment.class);
                subquery.select(assignmentRoot.get("transporter").get("id"))
                        .where(cb.equal(assignmentRoot.get("company").get("id"), companyId));
                predicates.add(root.get("id").in(subquery));
            }

            return cb.and(predicates.toArray(new jakarta.persistence.criteria.Predicate[0]));
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

    @Transactional
    public void deleteTransporter(UUID id) {
        // Delete assignments first
        List<TransporterAssignment> assignments = assignmentRepository.findByTransporterId(id);
        assignmentRepository.deleteAll(assignments);
        transporterRepository.deleteById(id);
    }

    private String generateTransporterCode() {
        String prefix = "T";
        String maxCode = transporterRepository.findMaxTransporterCodeByPrefix(prefix);

        int nextId = 1;
        if (maxCode != null) {
            try {
                String numericPart = maxCode.substring(prefix.length());
                nextId = Integer.parseInt(numericPart) + 1;
            } catch (Exception e) {
                // fall back
            }
        }
        return String.format("T%05d", nextId);
    }

    private TransporterResponse mapToResponse(Transporter t) {
        List<TransporterAssignmentResponse> assignments = assignmentRepository.findByTransporterId(t.getId()).stream()
                .map(this::mapToAssignmentResponse)
                .collect(Collectors.toList());

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
                .assignments(assignments)
                .build();
    }

    private TransporterAssignmentResponse mapToAssignmentResponse(TransporterAssignment as) {
        return TransporterAssignmentResponse.builder()
                .id(as.getId())
                .transporterId(as.getTransporter().getId())
                .transporterName(as.getTransporter().getName())
                .companyId(as.getCompany().getId())
                .companyName(as.getCompany().getName())
                .branchId(as.getBranch().getId())
                .branchName(as.getBranch().getName())
                .active(as.isActive())
                .build();
    }
}
