package com.dormscout.backend.service;

import com.dormscout.backend.entity.Booking;
import com.dormscout.backend.entity.User;
import com.dormscout.backend.entity.Listing;
import com.dormscout.backend.repository.BookingRepository;
import com.dormscout.backend.repository.ListingRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;
import java.util.List;

@Service
@Transactional
public class BookingService {
    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private ListingRepository listingRepository;

    private boolean isAcceptedStatus(String status) {
        if (status == null) {
            return false;
        }
        String normalized = status.trim().toLowerCase();
        return "accepted".equals(normalized) || "approved".equals(normalized)
                || "confirmed".equals(normalized) || "active".equals(normalized);
    }

    private void applyListingRoomTransition(Listing listing, boolean oldAccepted, boolean newAccepted) {
        if (listing == null || oldAccepted == newAccepted) {
            return;
        }

        int available = listing.getAvailableRooms() != null ? listing.getAvailableRooms() : 0;
        Integer total = listing.getTotalRooms();

        if (!oldAccepted && newAccepted) {
            if (available <= 0) {
                throw new RuntimeException("No available rooms left for this listing");
            }
            listing.setAvailableRooms(available - 1);
            listingRepository.save(listing);
            return;
        }

        // oldAccepted && !newAccepted -> tenant left or booking no longer active
        int incremented = available + 1;
        if (total != null) {
            incremented = Math.min(incremented, total);
        }
        listing.setAvailableRooms(incremented);
        listingRepository.save(listing);
    }

    public Booking createBooking(Booking booking) {
        Listing listing = booking.getListing();
        if (listing == null) {
            throw new RuntimeException("Listing is required");
        }

        int available = listing.getAvailableRooms() != null ? listing.getAvailableRooms() : 0;
        if (available <= 0) {
            throw new RuntimeException("No room available");
        }

        if (booking.getStatus() == null) {
            booking.setStatus("pending");
        }
        return bookingRepository.save(booking);
    }

    public List<Booking> getBookingsByTenant(User tenant) {
        return bookingRepository.findByTenant(tenant);
    }

    public List<Booking> getBookingsByListing(Listing listing) {
        return bookingRepository.findByListing(listing);
    }

    public Optional<Booking> getBookingById(Long id) {
        return bookingRepository.findById(id);
    }

    public Booking updateBookingStatus(Long id, String status) {
        Optional<Booking> bookingOpt = bookingRepository.findById(id);

        if (bookingOpt.isPresent()) {
            Booking booking = bookingOpt.get();
            boolean oldAccepted = isAcceptedStatus(booking.getStatus());
            boolean newAccepted = isAcceptedStatus(status);

            applyListingRoomTransition(booking.getListing(), oldAccepted, newAccepted);
            booking.setStatus(status);
            return bookingRepository.save(booking);
        }

        throw new RuntimeException("Booking not found");
    }

    public Booking updateBooking(Long id, Booking updates) {
        Optional<Booking> bookingOpt = bookingRepository.findById(id);

        if (bookingOpt.isPresent()) {
            Booking booking = bookingOpt.get();

            if (updates.getStatus() != null) {
                boolean oldAccepted = isAcceptedStatus(booking.getStatus());
                boolean newAccepted = isAcceptedStatus(updates.getStatus());

                applyListingRoomTransition(booking.getListing(), oldAccepted, newAccepted);
                booking.setStatus(updates.getStatus());
            }
            if (updates.getCheckInDate() != null) {
                booking.setCheckInDate(updates.getCheckInDate());
            }
            if (updates.getCheckOutDate() != null) {
                booking.setCheckOutDate(updates.getCheckOutDate());
            }

            return bookingRepository.save(booking);
        }

        throw new RuntimeException("Booking not found");
    }

    public List<Booking> getAllBookings() {
        return bookingRepository.findAll();
    }

    public void deleteBooking(Long id) {
        Optional<Booking> bookingOpt = bookingRepository.findById(id);
        if (bookingOpt.isPresent()) {
            Booking booking = bookingOpt.get();
            if (isAcceptedStatus(booking.getStatus())) {
                applyListingRoomTransition(booking.getListing(), true, false);
            }
            bookingRepository.delete(booking);
            return;
        }
        throw new RuntimeException("Booking not found");
    }
}
