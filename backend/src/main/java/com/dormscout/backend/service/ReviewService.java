package com.dormscout.backend.service;

import com.dormscout.backend.entity.Review;
import com.dormscout.backend.entity.Listing;
import com.dormscout.backend.entity.User;
import com.dormscout.backend.repository.ReviewRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;

@Service
public class ReviewService {
    @Autowired
    private ReviewRepository reviewRepository;

    public Review createReview(Review review) {
        return reviewRepository.save(review);
    }

    public List<Review> getAllReviews() {
        return reviewRepository.findAll();
    }

    public List<Review> getReviewsByListing(Listing listing) {
        return reviewRepository.findByListing(listing);
    }

    public List<Review> getReviewsByTenant(User tenant) {
        return reviewRepository.findByTenant(tenant);
    }

    public Optional<Review> getReviewById(Long id) {
        return reviewRepository.findById(id);
    }

    public void deleteReview(Long id) {
        reviewRepository.deleteById(id);
    }

    public Review updateReview(Long id, Long tenantId, Review updates) {
        Review review = reviewRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Review not found"));

        if (review.getTenant() == null || !review.getTenant().getId().equals(tenantId)) {
            throw new RuntimeException("You can only edit your own review");
        }

        if (updates.getRating() >= 1 && updates.getRating() <= 5) {
            review.setRating(updates.getRating());
        }
        if (updates.getBody() != null) {
            String body = updates.getBody().trim();
            if (body.length() < 5) {
                throw new RuntimeException("Review must be at least 5 characters");
            }
            review.setBody(body);
        }
        if (updates.getTags() != null) {
            review.setTags(updates.getTags());
        }
        review.setAnonymous(updates.isAnonymous());

        return reviewRepository.save(review);
    }

    public boolean hasReviewed(User tenant, Listing listing) { return reviewRepository.findByTenantAndListing(tenant, listing).isPresent(); }
}