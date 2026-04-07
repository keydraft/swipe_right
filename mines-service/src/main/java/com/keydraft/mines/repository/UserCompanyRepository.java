package com.keydraft.mines.repository;

import com.keydraft.mines.entity.Company;
import com.keydraft.mines.entity.User;
import com.keydraft.mines.entity.UserCompany;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserCompanyRepository extends JpaRepository<UserCompany, UUID> {
    List<UserCompany> findByUser(User user);

    @org.springframework.transaction.annotation.Transactional
    void deleteByUser(User user);

    Optional<UserCompany> findByUserAndCompany(User user, Company company);

    boolean existsByUser(User user);

    boolean existsByBranchIdAndUser_Role_Name(UUID branchId, String roleName);
}
