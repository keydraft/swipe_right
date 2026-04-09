package com.keydraft.mines.service;

import com.keydraft.mines.dto.PaginatedResponse;
import com.keydraft.mines.dto.TruckRequest;
import com.keydraft.mines.dto.TruckResponse;
import com.keydraft.mines.entity.Customer;
import com.keydraft.mines.entity.Transporter;
import com.keydraft.mines.entity.Truck;
import com.keydraft.mines.repository.CustomerRepository;
import com.keydraft.mines.repository.TransporterRepository;
import com.keydraft.mines.repository.TruckRepository;
import jakarta.persistence.criteria.JoinType;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
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
@Slf4j
public class TruckService {

    private final TruckRepository truckRepository;
    private final TransporterRepository transporterRepository;
    private final CustomerRepository customerRepository;
    private final FileStorageService fileStorageService;

    @Transactional
    public TruckResponse upsertTruckWithFiles(
            UUID id, 
            TruckRequest request,
            org.springframework.web.multipart.MultipartFile rcFront,
            org.springframework.web.multipart.MultipartFile rcBack,
            org.springframework.web.multipart.MultipartFile insurance,
            org.springframework.web.multipart.MultipartFile permit,
            org.springframework.web.multipart.MultipartFile fc) {
        
        Truck truck;
        if (id != null) {
            truck = truckRepository.findById(id).orElseThrow(() -> new RuntimeException("Truck not found"));
        } else {
            truck = new Truck();
        }

        truck.setOwnershipType(request.getOwnershipType());
        
        if (truck.getTruckNo() == null || truck.getTruckNo().isEmpty()) {
            if (request.getTruckNo() != null && !request.getTruckNo().isEmpty()) {
                truck.setTruckNo(request.getTruckNo());
            } else {
                truck.setTruckNo(generateTruckNo());
            }
        }
        
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
        if (rcFront != null) truck.setRcFrontPath(fileStorageService.storeFile(rcFront, "trucks/rc"));
        if (rcBack != null) truck.setRcBackPath(fileStorageService.storeFile(rcBack, "trucks/rc"));
        if (insurance != null) truck.setInsurancePath(fileStorageService.storeFile(insurance, "trucks/insurance"));
        if (permit != null) truck.setPermitPath(fileStorageService.storeFile(permit, "trucks/permit"));
        if (fc != null) truck.setFcPath(fileStorageService.storeFile(fc, "trucks/fc"));

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

    public List<TruckResponse> getAllTrucksList() {
        return truckRepository.findAll().stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    public PaginatedResponse<TruckResponse> getAllTrucks(String search, Pageable pageable) {
        Specification<Truck> spec = (root, query, cb) -> {
            if (search == null || search.isEmpty()) {
                return cb.conjunction();
            }
            String pattern = "%" + search.toLowerCase() + "%";
            return cb.or(
                    cb.like(cb.lower(root.get("truckNo")), pattern),
                    cb.like(cb.lower(root.get("registerName")), pattern),
                    cb.like(cb.lower(root.join("transporter", JoinType.LEFT).get("name")), pattern),
                    cb.like(cb.lower(root.join("customer", JoinType.LEFT).get("name")), pattern)
            );
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

    private String generateTruckNo() {
        String lastCode = truckRepository.findTopByOrderByTruckNoDesc()
                .map(Truck::getTruckNo)
                .filter(code -> code.startsWith("T"))
                .orElse("T00000");

        try {
            int lastNum = Integer.parseInt(lastCode.substring(1));
            String newCode = String.format("T%05d", lastNum + 1);
            log.info("Generated Global Truck Series: {}", newCode);
            return newCode;
        } catch (Exception e) {
            long count = truckRepository.count();
            String fallback = String.format("T%05d", count + 1);
            log.warn("Failed to parse last truck series {}, using count fallback: {}", lastCode, fallback);
            return fallback;
        }
    }

    private TruckResponse mapToResponse(Truck t) {
        return TruckResponse.builder()
                .id(t.getId())
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
