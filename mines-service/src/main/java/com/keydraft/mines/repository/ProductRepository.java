package com.keydraft.mines.repository;

import com.keydraft.mines.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ProductRepository extends JpaRepository<Product, UUID>, JpaSpecificationExecutor<Product> {
    List<Product> findByCompanyId(UUID companyId);

    @org.springframework.transaction.annotation.Transactional
    void deleteByCompanyId(UUID companyId);
}
