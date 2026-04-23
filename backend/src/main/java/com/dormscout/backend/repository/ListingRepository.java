package com.dormscout.backend.repository;

import com.dormscout.backend.entity.Listing;
import com.dormscout.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ListingRepository extends JpaRepository<Listing, Long> {
    List<Listing> findByLandlord(User landlord);
    List<Listing> findByStatus(String status);
}
