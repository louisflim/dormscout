package com.dormscout.backend.repository;

import com.dormscout.backend.entity.Listing;
import com.dormscout.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ListingRepository extends JpaRepository<Listing, Long> {
    @Query("SELECT l FROM Listing l JOIN FETCH l.landlord")
    List<Listing> findAllWithLandlord();

    @Query("SELECT l FROM Listing l JOIN FETCH l.landlord WHERE l.id = :id")
    Optional<Listing> findByIdWithLandlord(@Param("id") Long id);

    List<Listing> findByLandlord(User landlord);
    List<Listing> findByStatus(String status);
}
