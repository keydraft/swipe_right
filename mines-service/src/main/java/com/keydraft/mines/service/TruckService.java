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
public class TruckService {

    private final TruckRepository truckRepository;
    private final TransporterRepository transporterRepository;
    private final CustomerRepository customerRepository;

    @Transactional
    public TruckResponse upsertTruck(UUID id, TruckRequest request) {
        Truck truck;
        if (id != null) {
            truck = truckRepository.findById(id).orElseThrow(() -> new RuntimeException("Truck not found"));
        } else {
            truck = new Truck();
        }

        truck.setOwnershipType(request.getOwnershipType());
        truck.setTruckNo(request.getTruckNo());
        truck.setOwnerName(request.getOwnerName());
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
                    cb.like(cb.lower(root.get("ownerName")), pattern),
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

    private TruckResponse mapToResponse(Truck t) {
        return TruckResponse.builder()
                .id(t.getId())
                .ownershipType(t.getOwnershipType())
                .truckNo(t.getTruckNo())
                .ownerName(t.getOwnerName())
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
