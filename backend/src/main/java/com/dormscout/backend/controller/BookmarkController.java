package com.dormscout.backend.controller;

import com.dormscout.backend.entity.Bookmark;
import com.dormscout.backend.entity.User;
import com.dormscout.backend.entity.Listing;
import com.dormscout.backend.service.BookmarkService;
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
@RequestMapping("/api/bookmarks")
@CrossOrigin(origins = "http://localhost:3000")
public class BookmarkController {
    @Autowired
    private BookmarkService bookmarkService;

    @Autowired
    private UserService userService;

    @Autowired
    private ListingService listingService;

    @PostMapping
    public ResponseEntity<?> saveBookmark(@RequestParam Long tenantId,
                                          @RequestParam Long listingId) {
        try {
            Optional<User> tenantOpt     = userService.findById(tenantId);
            Optional<Listing> listingOpt = listingService.getListingById(listingId);

            if (!tenantOpt.isPresent() || !listingOpt.isPresent()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of(
                    "success", false, "message", "Tenant or listing not found"
                ));
            }

            Bookmark bookmark = new Bookmark();
            bookmark.setTenant(tenantOpt.get());
            bookmark.setListing(listingOpt.get());

            Bookmark saved = bookmarkService.saveBookmark(bookmark);
            return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                "success", true, "message", "Bookmarked", "data", saved
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of(
                "success", false, "message", e.getMessage()
            ));
        }
    }

    @GetMapping("/tenant/{tenantId}")
    public ResponseEntity<?> getBookmarksByTenant(@PathVariable Long tenantId) {
        Optional<User> tenantOpt = userService.findById(tenantId);
        if (!tenantOpt.isPresent()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of(
                "success", false, "message", "Tenant not found"
            ));
        }
        return ResponseEntity.ok(bookmarkService.getBookmarksByTenant(tenantOpt.get()));
    }

    @DeleteMapping
    public ResponseEntity<?> removeBookmark(@RequestParam Long tenantId,
                                            @RequestParam Long listingId) {
        try {
            Optional<User> tenantOpt     = userService.findById(tenantId);
            Optional<Listing> listingOpt = listingService.getListingById(listingId);

            if (!tenantOpt.isPresent() || !listingOpt.isPresent()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of(
                    "success", false, "message", "Tenant or listing not found"
                ));
            }

            bookmarkService.removeBookmark(tenantOpt.get(), listingOpt.get());
            return ResponseEntity.ok(Map.of("success", true, "message", "Bookmark removed"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of(
                "success", false, "message", e.getMessage()
            ));
        }
    }
}