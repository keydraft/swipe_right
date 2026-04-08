package com.keydraft.mines.repository;

import com.keydraft.mines.entity.Truck;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface TruckRepository extends JpaRepository<Truck, UUID>, JpaSpecificationExecutor<Truck> {
    boolean existsByTruckNo(String truckNo);
}
