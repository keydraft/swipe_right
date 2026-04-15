package com.keydraft.mines.repository;

import com.keydraft.mines.entity.Transporter;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import org.springframework.data.jpa.repository.Query;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface TransporterRepository extends JpaRepository<Transporter, UUID>, JpaSpecificationExecutor<Transporter> {
    boolean existsByiCode(String iCode);
    
    @Query("SELECT MAX(t.iCode) FROM Transporter t WHERE t.iCode LIKE :prefix%")
    String findMaxTransporterCodeByPrefix(@org.springframework.data.repository.query.Param("prefix") String prefix);

    java.util.List<Transporter> findByCompanyId(UUID companyId);
    java.util.List<Transporter> findByBranchId(UUID branchId);
}
