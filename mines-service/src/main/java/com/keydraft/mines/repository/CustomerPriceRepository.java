package com.keydraft.mines.repository;

import com.keydraft.mines.entity.CustomerPrice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.UUID;

@Repository
public interface CustomerPriceRepository extends JpaRepository<CustomerPrice, UUID> {
}
