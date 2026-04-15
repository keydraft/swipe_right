package com.keydraft.mines.repository;

import com.keydraft.mines.entity.ProductPrice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ProductPriceRepository extends JpaRepository<ProductPrice, UUID> {
    List<ProductPrice> findByProductId(UUID productId);
    List<ProductPrice> findByBranchId(UUID branchId);

    @org.springframework.transaction.annotation.Transactional
    void deleteByBranchId(UUID branchId);

    @org.springframework.transaction.annotation.Transactional
    @org.springframework.data.jpa.repository.Query("DELETE FROM ProductPrice p WHERE p.branch IN (SELECT b FROM Branch b WHERE b.company.id = :companyId)")
    @org.springframework.data.jpa.repository.Modifying
    void deleteByCompanyId(@Param("companyId") UUID companyId);
}
