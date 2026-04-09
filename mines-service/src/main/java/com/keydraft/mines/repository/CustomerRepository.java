package com.keydraft.mines.repository;

import com.keydraft.mines.entity.Customer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.UUID;

public interface CustomerRepository extends JpaRepository<Customer, UUID>, JpaSpecificationExecutor<Customer> {
    @Query("SELECT MAX(c.customerCode) FROM Customer c WHERE c.customerCode LIKE :prefix% AND c.company.id = :companyId AND (:branchId IS NULL OR c.branch.id = :branchId)")
    String findMaxCustomerCodeByPrefix(@Param("prefix") String prefix, @Param("companyId") UUID companyId, @Param("branchId") UUID branchId);
}
