package com.keydraft.mines.repository;

import com.keydraft.mines.entity.Truck;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface TruckRepository extends JpaRepository<Truck, UUID>, JpaSpecificationExecutor<Truck> {
    boolean existsByTruckNo(String truckNo);
    Optional<Truck> findByTruckNo(String truckNo);
    
    @org.springframework.data.jpa.repository.Query("SELECT MAX(t.truckCode) FROM Truck t WHERE t.truckCode LIKE :prefix%")
    String findMaxTruckCodeByPrefix(@org.springframework.data.repository.query.Param("prefix") String prefix);

    java.util.List<Truck> findByCompanyId(UUID companyId);
    java.util.List<Truck> findByBranchId(UUID branchId);
}
