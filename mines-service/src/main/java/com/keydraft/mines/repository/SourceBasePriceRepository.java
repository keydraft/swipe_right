package com.keydraft.mines.repository;

import com.keydraft.mines.entity.SourceBasePrice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface SourceBasePriceRepository extends JpaRepository<SourceBasePrice, UUID> {
    Optional<SourceBasePrice> findBySourceSiteIdAndProductId(UUID sourceSiteId, UUID productId);
}
