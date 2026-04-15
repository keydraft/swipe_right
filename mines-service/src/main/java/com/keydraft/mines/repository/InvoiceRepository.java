package com.keydraft.mines.repository;

import com.keydraft.mines.entity.Invoice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface InvoiceRepository extends JpaRepository<Invoice, UUID>, JpaSpecificationExecutor<Invoice> {
    @org.springframework.transaction.annotation.Transactional
    void deleteByBranchId(UUID branchId);

    @org.springframework.transaction.annotation.Transactional
    void deleteByCompanyId(UUID companyId);
}
