package com.keydraft.mines.repository;

import com.keydraft.mines.entity.CustomerPrice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.UUID;

@Repository
public interface CustomerPriceRepository extends JpaRepository<CustomerPrice, UUID> {
    List<CustomerPrice> findByCustomerId(UUID customerId);

    @org.springframework.transaction.annotation.Transactional
    void deleteByCustomerId(UUID customerId);

    @org.springframework.transaction.annotation.Transactional
    @org.springframework.data.jpa.repository.Query("DELETE FROM CustomerPrice cp WHERE cp.product.id IN (SELECT p.id FROM Product p WHERE p.company.id = :companyId)")
    @org.springframework.data.jpa.repository.Modifying
    void deleteByCompanyId(@org.springframework.data.repository.query.Param("companyId") UUID companyId);
}
