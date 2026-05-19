package com.dormscout.backend.controller;

import com.dormscout.backend.entity.User;
import com.dormscout.backend.service.UserService;
import com.dormscout.backend.service.ActivityService;
import com.dormscout.backend.service.AdminTokenService;
import com.dormscout.backend.dto.AdminDeleteRequest;
import com.dormscout.backend.dto.LoginRequest;
import com.dormscout.backend.dto.RegisterRequest;
import com.dormscout.backend.dto.UserDTO;
import com.dormscout.backend.service.BookingService;
import com.dormscout.backend.service.ListingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "http://localhost:3000")
public class UserController {
    @Autowired
    private UserService userService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private ActivityService activityService;

    @Autowired
    private AdminTokenService adminTokenService;

    @Autowired
    private ListingService listingService;

    @Autowired
    private BookingService bookingService;

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest request) {
        try {
            User registeredUser = userService.register(request);  // Pass the DTO
            UserDTO userDTO = userService.convertToDTO(registeredUser);
            return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                    "success", true,
                    "message", "Registration successful!",
                    "user", userDTO
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of(
                    "success", false,
                    "message", e.getMessage()
            ));
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest loginRequest) {
        Optional<User> userOpt = userService.login(loginRequest.getEmail(), loginRequest.getPassword());

        if (userOpt.isPresent()) {
            UserDTO userDTO = userService.convertToDTO(userOpt.get());
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Login successful!",
                    "user", userDTO
            ));
        }

        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of(
                "success", false,
                "message", "Invalid email or password"
        ));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getUserById(@PathVariable Long id) {
        Optional<User> userOpt = userService.findById(id);

        if (userOpt.isPresent()) {
            UserDTO userDTO = userService.convertToDTO(userOpt.get());
            return ResponseEntity.ok(userDTO);
        }

        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of(
                "success", false,
                "message", "User not found"
        ));
    }

    @GetMapping("/email/{email}")
    public ResponseEntity<?> getUserByEmail(@PathVariable String email) {
        Optional<User> userOpt = userService.findByEmail(email);

        if (userOpt.isPresent()) {
            UserDTO userDTO = userService.convertToDTO(userOpt.get());
            return ResponseEntity.ok(userDTO);
        }

        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of(
                "success", false,
                "message", "User not found"
        ));
    }

    @GetMapping
    public ResponseEntity<List<User>> getAllUsers() {
        return ResponseEntity.ok(userService.getAllUsers());
    }

    @GetMapping("/type/{userType}")
    public ResponseEntity<List<User>> getUsersByType(@PathVariable String userType) {
        return ResponseEntity.ok(userService.findByUserType(userType));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateUser(@PathVariable Long id, @RequestBody User updates) {
        try {
            boolean submittingVerification = updates.getBusinessName() != null || updates.getBusinessPermit() != null;
            User updatedUser = userService.updateUser(id, updates);
            if (submittingVerification && "pending".equalsIgnoreCase(updatedUser.getVerificationStatus())) {
                activityService.createActivity(
                        id,
                        "verification_pending",
                        "Your business verification request was submitted and is pending admin review.",
                        "just now",
                        "notifications"
                );
            }
            UserDTO userDTO = userService.convertToDTO(updatedUser);
            return ResponseEntity.ok(userDTO);
        } catch (RuntimeException e) {
            HttpStatus status = "User not found".equalsIgnoreCase(e.getMessage())
                    ? HttpStatus.NOT_FOUND
                    : HttpStatus.BAD_REQUEST;
            return ResponseEntity.status(status).body(Map.of(
                    "success", false,
                    "message", e.getMessage()
            ));
        }
    }

    @PostMapping("/{id}/business-update-request")
    public ResponseEntity<?> requestBusinessUpdate(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        String businessName = body != null ? body.get("businessName") : null;
        String businessPermit = body != null ? body.get("businessPermit") : null;
        try {
            UserDTO updated = userService.submitBusinessUpdateRequest(id, businessName, businessPermit);
            activityService.createActivity(
                    id,
                    "business_update_pending",
                    "Your business detail update request was submitted and is pending admin review.",
                    "just now",
                    "notifications"
            );
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Business update request submitted for admin review",
                    "data", updated
            ));
        } catch (RuntimeException e) {
            HttpStatus status = "User not found".equalsIgnoreCase(e.getMessage())
                    ? HttpStatus.NOT_FOUND
                    : HttpStatus.BAD_REQUEST;
            return ResponseEntity.status(status).body(Map.of(
                    "success", false,
                    "message", e.getMessage()
            ));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteUser(@PathVariable Long id) {
        try {
            userService.deleteUser(id);
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "User deleted successfully"
            ));
        } catch (RuntimeException e) {
            HttpStatus status = "User not found".equalsIgnoreCase(e.getMessage())
                ? HttpStatus.NOT_FOUND
                : HttpStatus.BAD_REQUEST;
            return ResponseEntity.status(status).body(Map.of(
                    "success", false,
                "message", e.getMessage()
            ));
        }
    }

    // ─── Admin Endpoints ─────────────────────────────────────────────────────

    @PostMapping("/admin/login")
    public ResponseEntity<?> adminLogin(@RequestBody LoginRequest loginRequest) {
        Optional<User> userOpt = userService.findByEmail(loginRequest.getEmail());

        if (userOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of(
                    "success", false,
                    "message", "Invalid email or password"
            ));
        }

        User user = userOpt.get();

        if (!"admin".equals(user.getUserType())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of(
                    "success", false,
                    "message", "Access denied: not an admin account"
            ));
        }

        if (!userService.checkPassword(loginRequest.getPassword(), user.getPassword())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of(
                    "success", false,
                    "message", "Invalid email or password"
            ));
        }

        UserDTO userDTO = userService.convertToDTO(user);
        String token = adminTokenService.createToken(user.getId());
        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Admin login successful!",
                "user", userDTO,
                "token", token,
                "expiresIn", 8 * 60 * 60
        ));
    }

    @GetMapping("/admin/users")
    public ResponseEntity<?> adminGetAllUsers() {
        List<User> users = userService.getAllUsers();
        return ResponseEntity.ok(Map.of(
                "success", true,
                "data", users
        ));
    }

    @GetMapping("/admin/tenants")
    public ResponseEntity<?> adminGetTenants() {
        List<User> tenants = userService.findByUserType("tenant");
        return ResponseEntity.ok(Map.of(
                "success", true,
                "data", tenants
        ));
    }

    @GetMapping("/admin/landlords")
    public ResponseEntity<?> adminGetLandlords() {
        List<User> landlords = userService.findByUserType("landlord");
        return ResponseEntity.ok(Map.of(
                "success", true,
                "data", landlords
        ));
    }

    @PutMapping("/admin/users/{id}")
    public ResponseEntity<?> adminUpdateUser(@PathVariable Long id, @RequestBody User updates) {
        try {
            User updatedUser = userService.updateUser(id, updates);
            UserDTO userDTO = userService.convertToDTO(updatedUser);
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "User updated successfully",
                    "data", userDTO
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of(
                    "success", false,
                    "message", e.getMessage()
            ));
        }
    }

    @DeleteMapping("/admin/users/{id}")
    public ResponseEntity<?> adminDeleteUser(@PathVariable Long id) {
        if (userService.findById(id).isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of(
                    "success", false,
                    "message", "User not found"
            ));
        }
        try {
            userService.deleteUser(id);
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "User deleted successfully"
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of(
                    "success", false,
                    "message", e.getMessage()
            ));
        }
    }

    @PostMapping("/admin/business-update/{id}/approve")
    public ResponseEntity<?> approveBusinessUpdate(@PathVariable Long id) {
        try {
            UserDTO updated = userService.approveBusinessUpdate(id);
            activityService.createActivity(
                    id,
                    "business_update_approved",
                    "Your business detail update was approved and is now active.",
                    "just now",
                    "notifications"
            );
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Business update approved",
                    "data", updated
            ));
        } catch (RuntimeException e) {
            HttpStatus status = "User not found".equalsIgnoreCase(e.getMessage())
                    ? HttpStatus.NOT_FOUND
                    : HttpStatus.BAD_REQUEST;
            return ResponseEntity.status(status).body(Map.of(
                    "success", false,
                    "message", e.getMessage()
            ));
        }
    }

    @PostMapping("/admin/business-update/{id}/reject")
    public ResponseEntity<?> rejectBusinessUpdate(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        String reason = body != null ? body.get("reason") : null;
        if (reason == null || reason.isBlank()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of(
                    "success", false,
                    "message", "A rejection explanation is required."
            ));
        }
        try {
            UserDTO updated = userService.rejectBusinessUpdate(id, reason.trim());
            activityService.createActivity(
                    id,
                    "business_update_rejected",
                    "Your business detail update was rejected. Reason: " + reason.trim(),
                    "just now",
                    "notifications"
            );
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Business update rejected",
                    "data", updated
            ));
        } catch (RuntimeException e) {
            HttpStatus status = "User not found".equalsIgnoreCase(e.getMessage())
                    ? HttpStatus.NOT_FOUND
                    : HttpStatus.BAD_REQUEST;
            return ResponseEntity.status(status).body(Map.of(
                    "success", false,
                    "message", e.getMessage()
            ));
        }
    }

    @PostMapping("/admin/verify-landlord/{id}/approve")
    public ResponseEntity<?> approveLandlordVerification(@PathVariable Long id) {
        UserDTO verified = userService.verifyLandlord(id, true, null);
        if (verified == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of(
                    "success", false,
                    "message", "User not found"
            ));
        }
        activityService.createActivity(
                id,
                "verification_approved",
                "Your business verification was approved. You are now a verified landlord.",
                "just now",
                "notifications"
        );
        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Landlord verification approved",
                "data", verified
        ));
    }

    @PostMapping("/admin/verify-landlord/{id}/reject")
    public ResponseEntity<?> rejectLandlordVerification(@PathVariable Long id, @RequestBody Map<String, String> body) {
        String reason = body != null ? body.get("reason") : null;
        if (reason == null || reason.isBlank()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of(
                    "success", false,
                    "message", "A rejection explanation is required."
            ));
        }
        reason = reason.trim();
        UserDTO rejected = userService.verifyLandlord(id, false, reason);
        if (rejected == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of(
                    "success", false,
                    "message", "User not found"
            ));
        }
        activityService.createActivity(
                id,
                "verification_rejected",
                "Your business verification was rejected. Reason: " + reason,
                "just now",
                "notifications"
        );
        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Landlord verification rejected",
                "data", rejected
        ));
    }

    @GetMapping("/admin/pending-verifications")
    public ResponseEntity<?> getPendingVerifications() {
        List<User> pendingUsers = userService.findByUserType("landlord").stream()
                .filter(u -> "pending".equals(u.getVerificationStatus()))
                .toList();
        List<UserDTO> dtos = pendingUsers.stream()
                .map(userService::convertToDTO)
                .toList();
        return ResponseEntity.ok(Map.of(
                "success", true,
                "data", dtos
        ));
    }

    @PostMapping("/admin/listings/{id}/delete")
    public ResponseEntity<?> adminDeleteListing(
            @PathVariable Long id,
            @RequestBody AdminDeleteRequest body) {
        try {
            String reason = body != null ? body.getReason() : null;
            listingService.deleteListingByAdmin(id, reason);
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Listing deleted and parties notified"
            ));
        } catch (RuntimeException e) {
            HttpStatus status = "Listing not found".equalsIgnoreCase(e.getMessage())
                    ? HttpStatus.NOT_FOUND
                    : HttpStatus.BAD_REQUEST;
            return ResponseEntity.status(status).body(Map.of(
                    "success", false,
                    "message", e.getMessage()
            ));
        }
    }

    @PostMapping("/admin/bookings/{id}/delete")
    public ResponseEntity<?> adminDeleteBooking(
            @PathVariable Long id,
            @RequestBody AdminDeleteRequest body) {
        try {
            String reason = body != null ? body.getReason() : null;
            bookingService.deleteBookingByAdmin(id, reason);
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Booking deleted and tenant notified"
            ));
        } catch (RuntimeException e) {
            HttpStatus status = "Booking not found".equalsIgnoreCase(e.getMessage())
                    ? HttpStatus.NOT_FOUND
                    : HttpStatus.BAD_REQUEST;
            return ResponseEntity.status(status).body(Map.of(
                    "success", false,
                    "message", e.getMessage()
            ));
        }
    }
}

