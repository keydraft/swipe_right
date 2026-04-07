package com.keydraft.mines.repository;

import com.keydraft.mines.entity.ProductPrice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ProductPriceRepository extends JpaRepository<ProductPrice, UUID> {
    List<ProductPrice> findByProductId(UUID productId);
    List<ProductPrice> findByBranchId(UUID branchId);
}
