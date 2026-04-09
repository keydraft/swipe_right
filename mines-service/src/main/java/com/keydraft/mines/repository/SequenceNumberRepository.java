package com.keydraft.mines.repository;

import com.keydraft.mines.entity.SequenceNumber;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.UUID;

public interface SequenceNumberRepository extends JpaRepository<SequenceNumber, UUID> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT s FROM SequenceNumber s WHERE s.company.id = :companyId " +
           "AND s.branch.id = :branchId AND s.documentType = :docType " +
           "AND s.financialYear = :fy")
    Optional<SequenceNumber> findForUpdate(
            @Param("companyId") UUID companyId,
            @Param("branchId") UUID branchId,
            @Param("docType") String docType,
            @Param("fy") String fy);
}
