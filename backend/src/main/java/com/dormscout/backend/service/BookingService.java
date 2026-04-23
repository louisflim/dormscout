package com.dormscout.backend.service;

import com.dormscout.backend.entity.Booking;
import com.dormscout.backend.entity.User;
import com.dormscout.backend.entity.Listing;
import com.dormscout.backend.repository.BookingRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Optional;
import java.util.List;

@Service
public class BookingService {
    @Autowired
    private BookingRepository bookingRepository;

    public Booking createBooking(Booking booking) {
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
        bookingRepository.deleteById(id);
    }
}
