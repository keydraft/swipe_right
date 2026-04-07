package com.keydraft.mines.repository;

import com.keydraft.mines.entity.Address;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.UUID;

public interface AddressRepository extends JpaRepository<Address, UUID> {
}
