package com.keydraft.mines.repository;

import com.keydraft.mines.entity.TruckAssignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface TruckAssignmentRepository extends JpaRepository<TruckAssignment, UUID> {
    List<TruckAssignment> findByTruckId(UUID truckId);
    List<TruckAssignment> findByBranchId(UUID branchId);
    boolean existsByTruckIdAndBranchId(UUID truckId, UUID branchId);
}
