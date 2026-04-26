package com.dormscout.backend.repository;

import com.dormscout.backend.entity.Bookmark;
import com.dormscout.backend.entity.User;
import com.dormscout.backend.entity.Listing;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface BookmarkRepository extends JpaRepository<Bookmark, Long> {
    List<Bookmark> findByTenant(User tenant);
    Optional<Bookmark> findByTenantAndListing(User tenant, Listing listing);
    void deleteByTenantAndListing(User tenant, Listing listing);
}