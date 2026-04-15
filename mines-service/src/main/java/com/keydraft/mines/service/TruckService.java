package com.keydraft.mines.service;

import com.keydraft.mines.dto.*;
import com.keydraft.mines.entity.*;
import com.keydraft.mines.repository.BranchRepository;
import com.keydraft.mines.repository.CompanyRepository;
import com.keydraft.mines.repository.CustomerRepository;
import com.keydraft.mines.repository.TransporterRepository;
import com.keydraft.mines.repository.TruckRepository;
import com.keydraft.mines.repository.TruckAssignmentRepository;
import jakarta.persistence.criteria.JoinType;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class TruckService {

    private final TruckRepository truckRepository;
    private final TransporterRepository transporterRepository;
    private final CustomerRepository customerRepository;
    private final FileStorageService fileStorageService;
    private final CompanyRepository companyRepository;
    private final BranchRepository branchRepository;
    private final TruckAssignmentRepository assignmentRepository;

    @Transactional
    public TruckResponse upsertTruckWithFiles(
            UUID id,
            TruckRequest request,
            MultipartFile rcFront,
            MultipartFile rcBack,
            MultipartFile insurance,
            MultipartFile permit,
            MultipartFile fc) {

        Truck truck;
        if (id != null) {
            truck = truckRepository.findById(id).orElseThrow(() -> new RuntimeException("Truck not found"));
        } else {
            truck = new Truck();
            if (request.getCompanyId() != null) {
                truck.setCompany(companyRepository.findById(request.getCompanyId())
                        .orElseThrow(() -> new RuntimeException("Company not found")));
            }
            if (request.getBranchId() != null) {
                truck.setBranch(branchRepository.findById(request.getBranchId())
                        .orElseThrow(() -> new RuntimeException("Branch not found")));
            }
            truck.setTruckCode(generateTruckCode(request.getCompanyId(), request.getBranchId()));
            if (request.getTruckNo() != null) {
                // Check if truck exists with this number to prevent duplicate key error
                truckRepository.findByTruckNo(request.getTruckNo()).ifPresent(t -> {
                    throw new RuntimeException("Truck number already exists: " + request.getTruckNo());
                });
            }
        }

        truck.setOwnershipType(request.getOwnershipType());
        truck.setTruckNo(request.getTruckNo());

        truck.setRegisterName(request.getRegisterName());
        truck.setMake(request.getMake());
        truck.setModel(request.getModel());
        truck.setEngineNo(request.getEngineNo());
        truck.setChassisNo(request.getChassisNo());
        truck.setInsuranceValidity(request.getInsuranceValidity());
        truck.setPermitValidity(request.getPermitValidity());
        truck.setFcValidity(request.getFcValidity());
        truck.setUsageType(request.getUsageType());
        truck.setFuelType(request.getFuelType());
        truck.setTareWeight(request.getTareWeight());

        // Save Files
        if (rcFront != null)
            truck.setRcFrontPath(fileStorageService.storeFile(rcFront, "trucks/rc"));
        if (rcBack != null)
            truck.setRcBackPath(fileStorageService.storeFile(rcBack, "trucks/rc"));
        if (insurance != null)
            truck.setInsurancePath(fileStorageService.storeFile(insurance, "trucks/insurance"));
        if (permit != null)
            truck.setPermitPath(fileStorageService.storeFile(permit, "trucks/permit"));
        if (fc != null)
            truck.setFcPath(fileStorageService.storeFile(fc, "trucks/fc"));

        if (request.getTransporterId() != null) {
            Transporter transporter = transporterRepository.findById(request.getTransporterId())
                    .orElseThrow(() -> new RuntimeException("Transporter not found"));
            truck.setTransporter(transporter);
        } else {
            truck.setTransporter(null);
        }

        if (request.getCustomerId() != null) {
            Customer customer = customerRepository.findById(request.getCustomerId())
                    .orElseThrow(() -> new RuntimeException("Customer not found"));
            truck.setCustomer(customer);
        } else {
            truck.setCustomer(null);
        }


        Truck saved = truckRepository.save(truck);
        return mapToResponse(saved);
    }

    @Transactional
    public TruckResponse upsertTruck(UUID id, TruckRequest request) {
        return upsertTruckWithFiles(id, request, null, null, null, null, null);
    }

    public List<TruckResponse> getAllTrucksList() {
        return truckRepository.findAll().stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    public PaginatedResponse<TruckResponse> getAllTrucks(String search, UUID companyId, UUID branchId, Pageable pageable) {
        Specification<Truck> spec = (root, query, cb) -> {
            java.util.List<jakarta.persistence.criteria.Predicate> predicates = new java.util.ArrayList<>();

            if (search != null && !search.isEmpty()) {
                String pattern = "%" + search.toLowerCase() + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("truckNo")), pattern),
                        cb.like(cb.lower(root.get("registerName")), pattern),
                        cb.like(cb.lower(root.join("transporter", JoinType.LEFT).get("name")), pattern),
                        cb.like(cb.lower(root.join("customer", JoinType.LEFT).get("name")), pattern)));
            }

            if (branchId != null) {
                // Check assignments for this branch
                jakarta.persistence.criteria.Subquery<UUID> subquery = query.subquery(UUID.class);
                jakarta.persistence.criteria.Root<TruckAssignment> assignmentRoot = subquery.from(TruckAssignment.class);
                subquery.select(assignmentRoot.get("truck").get("id"))
                        .where(cb.equal(assignmentRoot.get("branch").get("id"), branchId));
                predicates.add(root.get("id").in(subquery));
            } else if (companyId != null) {
                // Check assignments for this company
                jakarta.persistence.criteria.Subquery<UUID> subquery = query.subquery(UUID.class);
                jakarta.persistence.criteria.Root<TruckAssignment> assignmentRoot = subquery.from(TruckAssignment.class);
                subquery.select(assignmentRoot.get("truck").get("id"))
                        .where(cb.equal(assignmentRoot.get("company").get("id"), companyId));
                predicates.add(root.get("id").in(subquery));
            }

            return cb.and(predicates.toArray(new jakarta.persistence.criteria.Predicate[0]));
        };

        Page<Truck> page = truckRepository.findAll(spec, pageable);
        List<TruckResponse> content = page.getContent().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());

        return PaginatedResponse.<TruckResponse>builder()
                .content(content)
                .pageNumber(page.getNumber())
                .pageSize(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .last(page.isLast())
                .build();
    }

    public void deleteTruck(UUID id) {
        truckRepository.deleteById(id);
    }

    @Transactional
    public List<TruckAssignmentResponse> assignToBranch(TruckAssignmentRequest request) {
        Truck truck = truckRepository.findById(request.getTruckId())
                .orElseThrow(() -> new RuntimeException("Truck not found"));

        List<UUID> branchIds = request.getBranchIds();
        if (branchIds == null || branchIds.isEmpty()) {
            if (request.getBranchId() != null) {
                branchIds = List.of(request.getBranchId());
            } else {
                throw new RuntimeException("No branches selected for assignment");
            }
        }

        return branchIds.stream()
                .filter(branchId -> !assignmentRepository.existsByTruckIdAndBranchId(request.getTruckId(), branchId))
                .map(branchId -> {
                    Branch branch = branchRepository.findById(branchId)
                            .orElseThrow(() -> new RuntimeException("Branch not found: " + branchId));
                    Company company = branch.getCompany();

                    TruckAssignment assignment = TruckAssignment.builder()
                            .truck(truck)
                            .company(company)
                            .branch(branch)
                            .build();

                    return mapToAssignmentResponse(assignmentRepository.save(assignment));
                })
                .collect(Collectors.toList());
    }

    @Transactional
    public void removeAssignment(UUID id) {
        assignmentRepository.deleteById(id);
    }

    public List<TruckResponse> getTrucksForBranch(UUID branchId) {
        return assignmentRepository.findByBranchId(branchId).stream()
                .map(as -> mapToResponse(as.getTruck()))
                .collect(Collectors.toList());
    }

    private TruckAssignmentResponse mapToAssignmentResponse(TruckAssignment as) {
        return TruckAssignmentResponse.builder()
                .id(as.getId())
                .truckId(as.getTruck().getId())
                .truckNo(as.getTruck().getTruckNo())
                .companyId(as.getCompany().getId())
                .companyName(as.getCompany().getName())
                .branchId(as.getBranch().getId())
                .branchName(as.getBranch().getName())
                .active(as.isActive())
                .build();
    }

    private String generateTruckCode(UUID companyId, UUID branchId) {
        String prefix = "TRK-";
        String maxCode = truckRepository.findMaxTruckCodeByPrefix(prefix);

        int nextId = 1;
        if (maxCode != null) {
            try {
                String numericPart = maxCode.substring(prefix.length());
                nextId = Integer.parseInt(numericPart) + 1;
            } catch (Exception e) {
                // fall back
            }
        }
        return prefix + String.format("%04d", nextId);
    }

    private TruckResponse mapToResponse(Truck t) {
        List<TruckAssignmentResponse> assignments = assignmentRepository.findByTruckId(t.getId()).stream()
                .map(this::mapToAssignmentResponse)
                .collect(Collectors.toList());

        return TruckResponse.builder()
                .id(t.getId())
                .truckCode(t.getTruckCode())
                .companyId(t.getCompany() != null ? t.getCompany().getId() : null)
                .companyName(t.getCompany() != null ? t.getCompany().getName() : null)
                .branchId(t.getBranch() != null ? t.getBranch().getId() : null)
                .branchName(t.getBranch() != null ? t.getBranch().getName() : null)
                .assignments(assignments)
                .ownershipType(t.getOwnershipType())
                .truckNo(t.getTruckNo())
                .registerName(t.getRegisterName())
                .transporterId(t.getTransporter() != null ? t.getTransporter().getId() : null)
                .transporterName(t.getTransporter() != null ? t.getTransporter().getName() : null)
                .customerId(t.getCustomer() != null ? t.getCustomer().getId() : null)
                .customerName(t.getCustomer() != null ? t.getCustomer().getName() : null)
                .make(t.getMake())
                .model(t.getModel())
                .engineNo(t.getEngineNo())
                .chassisNo(t.getChassisNo())
                .insuranceValidity(t.getInsuranceValidity())
                .permitValidity(t.getPermitValidity())
                .fcValidity(t.getFcValidity())
                .usageType(t.getUsageType())
                .fuelType(t.getFuelType())
                .tareWeight(t.getTareWeight())
                .rcFrontPath(t.getRcFrontPath())
                .rcBackPath(t.getRcBackPath())
                .insurancePath(t.getInsurancePath())
                .permitPath(t.getPermitPath())
                .fcPath(t.getFcPath())
                .build();
    }
}
