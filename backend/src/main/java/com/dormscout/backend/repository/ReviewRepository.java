package com.dormscout.backend.repository;

import com.dormscout.backend.entity.Review;
import com.dormscout.backend.entity.Listing;
import com.dormscout.backend.entity.User;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface ReviewRepository extends JpaRepository<Review, Long> {
    @EntityGraph(attributePaths = { "tenant", "listing" })
    List<Review> findByListing(Listing listing);
    List<Review> findByTenant(User tenant);
    void deleteByTenant(User tenant);
    void deleteAllByListing(Listing listing);

    Optional<Review> findByTenantAndListing(User tenant, Listing listing);
}