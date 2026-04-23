package com.dormscout.backend.controller;

import com.dormscout.backend.entity.Booking;
import com.dormscout.backend.entity.User;
import com.dormscout.backend.entity.Listing;
import com.dormscout.backend.service.BookingService;
import com.dormscout.backend.service.UserService;
import com.dormscout.backend.service.ListingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/bookings")
@CrossOrigin(origins = "http://localhost:3000")
public class BookingController {
    @Autowired
    private BookingService bookingService;

    @Autowired
    private UserService userService;

    @Autowired
    private ListingService listingService;

    @PostMapping
    public ResponseEntity<?> createBooking(@RequestBody Booking booking, 
                                          @RequestParam Long tenantId, 
                                          @RequestParam Long listingId) {
        try {
            Optional<User> tenantOpt = userService.findById(tenantId);
            Optional<Listing> listingOpt = listingService.getListingById(listingId);

            if (!tenantOpt.isPresent()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of(
                        "success", false,
                        "message", "Tenant not found"
                ));
            }

            if (!listingOpt.isPresent()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of(
                        "success", false,
                        "message", "Listing not found"
                ));
            }

            booking.setTenant(tenantOpt.get());
            booking.setListing(listingOpt.get());

            Booking createdBooking = bookingService.createBooking(booking);
            return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                    "success", true,
                    "message", "Booking created successfully",
                    "booking", createdBooking
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of(
                    "success", false,
                    "message", e.getMessage()
            ));
        }
    }

    @GetMapping
    public ResponseEntity<List<Booking>> getAllBookings() {
        return ResponseEntity.ok(bookingService.getAllBookings());
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getBookingById(@PathVariable Long id) {
        Optional<Booking> bookingOpt = bookingService.getBookingById(id);

        if (bookingOpt.isPresent()) {
            return ResponseEntity.ok(bookingOpt.get());
        }

        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of(
                "success", false,
                "message", "Booking not found"
        ));
    }

    @GetMapping("/tenant/{tenantId}")
    public ResponseEntity<?> getBookingsByTenant(@PathVariable Long tenantId) {
        try {
            Optional<User> tenantOpt = userService.findById(tenantId);

            if (!tenantOpt.isPresent()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of(
                        "success", false,
                        "message", "Tenant not found"
                ));
            }

            List<Booking> bookings = bookingService.getBookingsByTenant(tenantOpt.get());
            return ResponseEntity.ok(bookings);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of(
                    "success", false,
                    "message", e.getMessage()
            ));
        }
    }

    @GetMapping("/listing/{listingId}")
    public ResponseEntity<?> getBookingsByListing(@PathVariable Long listingId) {
        try {
            Optional<Listing> listingOpt = listingService.getListingById(listingId);

            if (!listingOpt.isPresent()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of(
                        "success", false,
                        "message", "Listing not found"
                ));
            }

            List<Booking> bookings = bookingService.getBookingsByListing(listingOpt.get());
            return ResponseEntity.ok(bookings);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of(
                    "success", false,
                    "message", e.getMessage()
            ));
        }
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<?> updateBookingStatus(@PathVariable Long id, @RequestParam String status) {
        try {
            Booking updatedBooking = bookingService.updateBookingStatus(id, status);
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Booking status updated successfully",
                    "booking", updatedBooking
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of(
                    "success", false,
                    "message", e.getMessage()
            ));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateBooking(@PathVariable Long id, @RequestBody Booking updates) {
        try {
            Booking updatedBooking = bookingService.updateBooking(id, updates);
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Booking updated successfully",
                    "booking", updatedBooking
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of(
                    "success", false,
                    "message", e.getMessage()
            ));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteBooking(@PathVariable Long id) {
        try {
            bookingService.deleteBooking(id);
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Booking deleted successfully"
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of(
                    "success", false,
                    "message", "Booking not found"
            ));
        }
    }
}
