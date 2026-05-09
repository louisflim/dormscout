package com.dormscout.backend.controller;

import com.dormscout.backend.entity.Booking;
import com.dormscout.backend.entity.User;
import com.dormscout.backend.entity.Listing;
import com.dormscout.backend.service.BookingService;
import com.dormscout.backend.service.UserService;
import com.dormscout.backend.service.ListingService;
import com.dormscout.backend.service.ActivityService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.format.DateTimeParseException;
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

    @Autowired
    private ActivityService activityService;

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

            // Notify landlord that a new booking request was made
            Listing bookedListing = listingOpt.get();
            User landlord = bookedListing.getLandlord();
            if (landlord != null) {
                String tenantName = tenantOpt.get().getFirstName() + " " + tenantOpt.get().getLastName();
                activityService.createActivity(
                    landlord.getId(),
                    "booking",
                    tenantName.trim() + " requested to book \"" + bookedListing.getTitle() + "\"",
                    "just now",
                    "listing"
                );
            }

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
    public ResponseEntity<?> updateBookingStatus(
            @PathVariable Long id,
            @RequestParam(required = false) String status,
            @RequestBody(required = false) Map<String, Object> requestBody
    ) {
        try {
            String resolvedStatus = status;
            if (resolvedStatus == null && requestBody != null && requestBody.get("status") != null) {
                resolvedStatus = requestBody.get("status").toString();
            }

            if (resolvedStatus == null || resolvedStatus.trim().isEmpty()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of(
                        "success", false,
                        "message", "Status is required"
                ));
            }

            Booking updatedBooking = bookingService.updateBookingStatus(id, resolvedStatus);

            // Notify tenant about the status change
            User tenant = updatedBooking.getTenant();
            Listing listing = updatedBooking.getListing();
            if (tenant != null && listing != null) {
                String statusMsg;
                String normalised = resolvedStatus.trim().toLowerCase();
                if ("accepted".equals(normalised) || "approved".equals(normalised)) {
                    statusMsg = "Your booking for \"" + listing.getTitle() + "\" has been accepted!";
                } else if ("rejected".equals(normalised) || "declined".equals(normalised)) {
                    statusMsg = "Your booking for \"" + listing.getTitle() + "\" was declined.";
                } else if ("cancelled".equals(normalised) || "canceled".equals(normalised)) {
                    statusMsg = "Your booking for \"" + listing.getTitle() + "\" has been cancelled.";
                } else {
                    statusMsg = "Your booking for \"" + listing.getTitle() + "\" status changed to " + resolvedStatus + ".";
                }
                activityService.createActivity(tenant.getId(), "booking", statusMsg, "just now", "booking");
            }

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Booking status updated successfully",
                    "booking", updatedBooking
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of(
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
    public ResponseEntity<?> deleteBooking(
            @PathVariable Long id,
            @RequestParam(required = false) String moveOutDate) {
        try {
            LocalDate moveOut = null;
            if (moveOutDate != null && !moveOutDate.isBlank()) {
                moveOut = LocalDate.parse(moveOutDate.trim());
            }
            bookingService.deleteBooking(id, moveOut);
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Booking deleted successfully"
            ));
        } catch (DateTimeParseException e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "Invalid move-out date"
            ));
        } catch (RuntimeException e) {
            String msg = e.getMessage() != null ? e.getMessage() : "Booking not found";
            boolean badRequest = msg.contains("Move-out") || msg.contains("move-out")
                    || msg.contains("required") || msg.contains("Invalid");
            HttpStatus status = badRequest ? HttpStatus.BAD_REQUEST : HttpStatus.NOT_FOUND;
            return ResponseEntity.status(status).body(Map.of(
                    "success", false,
                    "message", msg
            ));
        }
    }
}
