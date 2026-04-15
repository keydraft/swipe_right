package com.keydraft.mines.repository;

import com.keydraft.mines.entity.TransporterAssignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface TransporterAssignmentRepository extends JpaRepository<TransporterAssignment, UUID> {
    List<TransporterAssignment> findByBranchId(UUID branchId);
    List<TransporterAssignment> findByCompanyId(UUID companyId);
    List<TransporterAssignment> findByTransporterId(UUID transporterId);
    Optional<TransporterAssignment> findByTransporterIdAndBranchId(UUID transporterId, UUID branchId);
    boolean existsByTransporterIdAndBranchId(UUID transporterId, UUID branchId);
}
