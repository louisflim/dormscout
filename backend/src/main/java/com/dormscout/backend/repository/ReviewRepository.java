package com.dormscout.backend.repository;

import com.dormscout.backend.entity.Review;
import com.dormscout.backend.entity.Listing;
import com.dormscout.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ReviewRepository extends JpaRepository<Review, Long> {
    List<Review> findByListing(Listing listing);
    List<Review> findByTenant(User tenant);
}