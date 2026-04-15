package com.keydraft.mines.repository;

import com.keydraft.mines.entity.SalesOrder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.UUID;

@Repository
public interface SalesOrderRepository extends JpaRepository<SalesOrder, UUID> {
    @org.springframework.transaction.annotation.Transactional
    @org.springframework.data.jpa.repository.Query("DELETE FROM SalesOrder s WHERE s.product.id IN (SELECT p.id FROM Product p WHERE p.company.id = :companyId)")
    @org.springframework.data.jpa.repository.Modifying
    void deleteByCompanyId(@org.springframework.data.repository.query.Param("companyId") UUID companyId);
}
