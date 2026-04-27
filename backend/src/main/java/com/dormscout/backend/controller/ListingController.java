package com.dormscout.backend.controller;

import com.dormscout.backend.entity.Listing;
import com.dormscout.backend.entity.User;
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
@RequestMapping("/api/listings")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:3001", "http://localhost:3002"})
public class ListingController {
    @Autowired
    private ListingService listingService;

    @Autowired
    private UserService userService;

    @PostMapping
    public ResponseEntity<?> createListing(@RequestBody Listing listing, @RequestParam Long landlordId) {
        try {
            Optional<User> landlordOpt = userService.findById(landlordId);

            if (!landlordOpt.isPresent()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of(
                        "success", false,
                        "message", "Landlord not found"
                ));
            }

            Listing createdListing = listingService.createListing(listing, landlordOpt.get());
            return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                    "success", true,
                    "message", "Listing created successfully",
                    "listing", createdListing
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of(
                    "success", false,
                    "message", e.getMessage()
            ));
        }
    }

    @GetMapping
    public ResponseEntity<List<Listing>> getAllListings() {
        return ResponseEntity.ok(listingService.getAllListings());
    }

    @GetMapping("/active")
    public ResponseEntity<List<Listing>> getActiveListings() {
        return ResponseEntity.ok(listingService.getActiveListings());
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getListingById(@PathVariable Long id) {
        Optional<Listing> listingOpt = listingService.getListingById(id);

        if (listingOpt.isPresent()) {
            return ResponseEntity.ok(listingOpt.get());
        }

        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of(
                "success", false,
                "message", "Listing not found"
        ));
    }

    @GetMapping("/landlord/{landlordId}")
    public ResponseEntity<?> getListingsByLandlord(@PathVariable Long landlordId) {
        try {
            Optional<User> landlordOpt = userService.findById(landlordId);

            if (!landlordOpt.isPresent()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of(
                        "success", false,
                        "message", "Landlord not found"
                ));
            }

            List<Listing> listings = listingService.getListingsByLandlord(landlordOpt.get());
            return ResponseEntity.ok(listings);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of(
                    "success", false,
                    "message", e.getMessage()
            ));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateListing(@PathVariable Long id, @RequestBody Listing updates) {
        try {
            Listing updatedListing = listingService.updateListing(id, updates);
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Listing updated successfully",
                    "listing", updatedListing
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of(
                    "success", false,
                    "message", e.getMessage()
            ));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteListing(@PathVariable Long id) {
        try {
            listingService.deleteListing(id);
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Listing deleted successfully"
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of(
                    "success", false,
                    "message", "Listing not found"
            ));
        }
    }
}
