package com.keydraft.mines.repository;

import com.keydraft.mines.entity.CustomerSite;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface CustomerSiteRepository extends JpaRepository<CustomerSite, UUID> {
}
