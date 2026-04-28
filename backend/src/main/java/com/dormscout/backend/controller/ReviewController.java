package com.dormscout.backend.controller;

import com.dormscout.backend.entity.Review;
import com.dormscout.backend.entity.Listing;
import com.dormscout.backend.entity.User;
import com.dormscout.backend.service.ReviewService;
import com.dormscout.backend.service.ListingService;
import com.dormscout.backend.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/reviews")
@CrossOrigin(origins = "http://localhost:3000")
public class ReviewController {
    @Autowired
    private ReviewService reviewService;

    @Autowired
    private ListingService listingService;

    @Autowired
    private UserService userService;

    @PostMapping
    public ResponseEntity<?> createReview(@RequestBody Review review,
                                          @RequestParam Long tenantId,
                                          @RequestParam Long listingId) {
        try {
            Optional<User> tenantOpt     = userService.findById(tenantId);
            Optional<Listing> listingOpt = listingService.getListingById(listingId);

            if (!tenantOpt.isPresent() || !listingOpt.isPresent()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of(
                    "success", false, "message", "Tenant or listing not found"
                ));
            }

            review.setTenant(tenantOpt.get());
            review.setListing(listingOpt.get());

            Review created = reviewService.createReview(review);
            return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                "success", true, "message", "Review posted", "data", created
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of(
                "success", false, "message", e.getMessage()
            ));
        }
    }

    @GetMapping
    public ResponseEntity<List<Review>> getAllReviews() {
        return ResponseEntity.ok(reviewService.getAllReviews());
    }

    @GetMapping("/listing/{listingId}")
    public ResponseEntity<?> getByListing(@PathVariable Long listingId) {
        Optional<Listing> listingOpt = listingService.getListingById(listingId);
        if (!listingOpt.isPresent()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of(
                "success", false, "message", "Listing not found"
            ));
        }
        return ResponseEntity.ok(reviewService.getReviewsByListing(listingOpt.get()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteReview(@PathVariable Long id) {
        try {
            reviewService.deleteReview(id);
            return ResponseEntity.ok(Map.of("success", true, "message", "Review deleted"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of(
                "success", false, "message", "Review not found"
            ));
        }
    }
}