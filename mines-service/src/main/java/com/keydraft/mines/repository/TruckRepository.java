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
    
    @org.springframework.data.jpa.repository.Query("SELECT MAX(t.truckCode) FROM Truck t WHERE t.truckCode LIKE :prefix% AND t.company.id = :companyId AND (:branchId IS NULL OR t.branch.id = :branchId)")
    String findMaxTruckCodeByPrefix(@org.springframework.data.repository.query.Param("prefix") String prefix, @org.springframework.data.repository.query.Param("companyId") UUID companyId, @org.springframework.data.repository.query.Param("branchId") UUID branchId);
}
