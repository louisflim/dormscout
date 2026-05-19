package com.dormscout.backend.service;

import com.dormscout.backend.entity.Booking;
import com.dormscout.backend.entity.Listing;
import com.dormscout.backend.entity.User;
import com.dormscout.backend.repository.BookmarkRepository;
import com.dormscout.backend.repository.ListingRepository;
import com.dormscout.backend.repository.ReviewRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.Optional;
import java.util.List;
import java.util.Set;

@Service
public class ListingService {
    @Autowired
    private ListingRepository listingRepository;

    @Autowired
    private BookmarkRepository bookmarkRepository;

    @Autowired
    private ReviewRepository reviewRepository;

    @Autowired
    private BookingService bookingService;

    @Autowired
    private ActivityService activityService;

    public Listing createListing(Listing listing, User landlord) {
        listing.setLandlord(landlord);
        if (listing.getStatus() == null) {
            listing.setStatus("Active");
        }
        return listingRepository.save(listing);
    }

    public List<Listing> getListingsByLandlord(User landlord) {
        return listingRepository.findByLandlord(landlord);
    }

    public List<Listing> getAllListings() {
        return listingRepository.findAllWithLandlord();
    }

    public List<Listing> getActiveListings() {
        return listingRepository.findAllWithLandlord().stream()
                .filter(l -> "Active".equalsIgnoreCase(l.getStatus()))
                .toList();
    }

    public Optional<Listing> getListingById(Long id) {
        return listingRepository.findByIdWithLandlord(id);
    }

    public Listing updateListing(Long id, Listing updates) {
        Optional<Listing> listingOpt = listingRepository.findById(id);

        if (listingOpt.isPresent()) {
            Listing listing = listingOpt.get();

            if (updates.getTitle() != null) {
                listing.setTitle(updates.getTitle());
            }
            if (updates.getAddress() != null) {
                listing.setAddress(updates.getAddress());
            }
            if (updates.getLatitude() != null) {
                listing.setLatitude(updates.getLatitude());
            }
            if (updates.getLongitude() != null) {
                listing.setLongitude(updates.getLongitude());
            }
            if (updates.getPrice() != null) {
                listing.setPrice(updates.getPrice());
            }
            if (updates.getRooms() != null) {
                listing.setRooms(updates.getRooms());
            }
            if (updates.getTotalRooms() != null) {
                listing.setTotalRooms(updates.getTotalRooms());
            }
            if (updates.getAvailableRooms() != null) {
                listing.setAvailableRooms(updates.getAvailableRooms());
            }
            if (updates.getDescription() != null) {
                listing.setDescription(updates.getDescription());
            }
            if (updates.getStatus() != null) {
                listing.setStatus(updates.getStatus());
            }
            if (updates.getGenderPolicy() != null) {
                listing.setGenderPolicy(updates.getGenderPolicy());
            }
            if (updates.getUniversity() != null) {
                listing.setUniversity(updates.getUniversity());
            }
            if (updates.getImages() != null) {
                listing.setImages(updates.getImages());
            }
            if (updates.getTags() != null) {
                listing.setTags(updates.getTags());
            }

            return listingRepository.save(listing);
        }

        throw new RuntimeException("Listing not found");
    }

    @Transactional
    public void deleteListing(Long id) {
        Listing listing = listingRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Listing not found"));

        for (Booking booking : bookingService.getBookingsForListing(listing)) {
            bookingService.removeBookingRecord(booking);
        }

        bookmarkRepository.deleteAllByListing(listing);
        reviewRepository.deleteAllByListing(listing);
        listingRepository.delete(listing);
    }

    /**
     * Admin removal with a required reason; notifies the landlord and tenants with bookings.
     * Associated bookmarks are removed automatically.
     */
    @Transactional
    public void deleteListingByAdmin(Long id, String reason) {
        String trimmed = reason == null ? "" : reason.trim();
        if (trimmed.isEmpty()) {
            throw new RuntimeException("A reason is required to delete this listing");
        }

        Listing listing = listingRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Listing not found"));

        String title = listing.getTitle() != null ? listing.getTitle() : "Listing";
        Set<Long> notifiedTenants = new HashSet<>();

        for (Booking booking : bookingService.getBookingsForListing(listing)) {
            User tenant = booking.getTenant();
            if (tenant != null && notifiedTenants.add(tenant.getId())) {
                activityService.createActivity(
                        tenant.getId(),
                        "booking",
                        "The listing \"" + title + "\" was removed by an administrator, so your booking was cancelled. Reason: " + trimmed,
                        "just now",
                        "booking"
                );
            }
            bookingService.removeBookingRecord(booking);
        }

        User landlord = listing.getLandlord();
        if (landlord != null) {
            activityService.createActivity(
                    landlord.getId(),
                    "listing",
                    "Your listing \"" + title + "\" was removed by an administrator. Reason: " + trimmed,
                    "just now",
                    "listing"
            );
        }

        bookmarkRepository.deleteAllByListing(listing);
        reviewRepository.deleteAllByListing(listing);
        listingRepository.delete(listing);
    }
}
