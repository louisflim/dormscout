package com.dormscout.backend.service;

import com.dormscout.backend.entity.Listing;
import com.dormscout.backend.entity.User;
import com.dormscout.backend.repository.ActivityRepository;
import com.dormscout.backend.repository.BookingRepository;
import com.dormscout.backend.repository.BookmarkRepository;
import com.dormscout.backend.repository.ListingRepository;
import com.dormscout.backend.repository.MessageRepository;
import com.dormscout.backend.repository.ReportRepository;
import com.dormscout.backend.repository.ReviewRepository;
import com.dormscout.backend.repository.UserRepository;
import com.dormscout.backend.dto.RegisterRequest;
import com.dormscout.backend.dto.UserDTO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;
import java.util.List;

@Service
public class UserService {
    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private ListingService listingService;

    @Autowired
    private ListingRepository listingRepository;

    @Autowired
    private BookmarkRepository bookmarkRepository;

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private ReviewRepository reviewRepository;

    @Autowired
    private ReportRepository reportRepository;

    @Autowired
    private ActivityRepository activityRepository;

    @Autowired
    private MessageRepository messageRepository;

    public User register(RegisterRequest request) {
        // Check if user already exists
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new RuntimeException("Email already exists");
        }

        // Validate required fields
        if (request.getFirstName() == null || request.getFirstName().trim().isEmpty()) {
            throw new RuntimeException("First name is required");
        }
        if (request.getPassword() == null || request.getPassword().trim().isEmpty()) {
            throw new RuntimeException("Password is required");
        }

        // Create new user from request
        User user = new User();
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));  // Encode here
        user.setFirstName(request.getFirstName());
        user.setLastName(request.getLastName());
        user.setPhone(request.getPhone());
        user.setUserType(request.getUserType());
        user.setGender(request.getGender());
        user.setSchool(request.getSchool());
        user.setCourse(request.getCourse());
        user.setYearLevel(request.getYearLevel());
        user.setStudentId(request.getStudentId());
        user.setBusinessName(request.getBusinessName());
        user.setBusinessPermit(request.getBusinessPermit());

        return userRepository.save(user);
    }

    public Optional<User> login(String email, String password) {
        Optional<User> userOpt = userRepository.findByEmail(email);

        if (userOpt.isPresent()) {
            User user = userOpt.get();
            // Verify password
            if (passwordEncoder.matches(password, user.getPassword())) {
                return Optional.of(user);
            }
        }

        return Optional.empty();
    }

    public Optional<User> findById(Long id) {
        return userRepository.findById(id);
    }

    public Optional<User> findByEmail(String email) {
        return userRepository.findByEmail(email);
    }

    public List<User> findByUserType(String userType) {
        return userRepository.findByUserType(userType);
    }

    public User updateUser(Long id, User updates) {
        Optional<User> userOpt = userRepository.findById(id);

        if (userOpt.isPresent()) {
            User user = userOpt.get();

            if (updates.getEmail() != null && !updates.getEmail().equalsIgnoreCase(user.getEmail())) {
                Optional<User> existingUser = userRepository.findByEmail(updates.getEmail());
                if (existingUser.isPresent() && !existingUser.get().getId().equals(id)) {
                    throw new RuntimeException("Email already exists");
                }
                user.setEmail(updates.getEmail());
            }
            if (updates.getFirstName() != null) {
                user.setFirstName(updates.getFirstName());
            }
            if (updates.getLastName() != null) {
                user.setLastName(updates.getLastName());
            }
            if (updates.getPhone() != null) {
                user.setPhone(updates.getPhone());
            }
            if (updates.getGender() != null) {
                user.setGender(updates.getGender());
            }
            if (updates.getSchool() != null) {
                user.setSchool(updates.getSchool());
            }
            if (updates.getCourse() != null) {
                user.setCourse(updates.getCourse());
            }
            if (updates.getYearLevel() != null) {
                user.setYearLevel(updates.getYearLevel());
            }
            if (updates.getStudentId() != null) {
                user.setStudentId(updates.getStudentId());
            }
            if (updates.getProfileImage() != null) {
                user.setProfileImage(updates.getProfileImage());
            }
            if (updates.getPassword() != null && !updates.getPassword().trim().isEmpty()) {
                user.setPassword(passwordEncoder.encode(updates.getPassword()));
            }
            if (updates.getBusinessName() != null) {
                user.setBusinessName(updates.getBusinessName());
            }
            if (updates.getBusinessPermit() != null) {
                user.setBusinessPermit(updates.getBusinessPermit());
            }
            if (updates.getEmailNotifications() != null) {
                user.setEmailNotifications(updates.getEmailNotifications());
            }
            if (updates.getInAppNotifications() != null) {
                user.setInAppNotifications(updates.getInAppNotifications());
            }
            if (updates.getMessageAlerts() != null) {
                user.setMessageAlerts(updates.getMessageAlerts());
            }
            if (updates.getDarkMode() != null) {
                user.setDarkMode(updates.getDarkMode());
            }
            if (updates.getBusinessName() != null || updates.getBusinessPermit() != null) {
                user.setVerified(false);
                user.setVerificationStatus("pending");
                user.setRejectionReason(null);
            }

            return userRepository.save(user);
        }

        throw new RuntimeException("User not found");
    }

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    @Transactional
    public void deleteUser(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if ("landlord".equalsIgnoreCase(user.getUserType())) {
            List<Listing> ownedListings = listingRepository.findByLandlord(user);
            for (Listing listing : ownedListings) {
                listingService.deleteListing(listing.getId());
            }
        }

        bookmarkRepository.deleteByTenant(user);
        bookingRepository.deleteByTenant(user);
        reviewRepository.deleteByTenant(user);
        reportRepository.deleteByReporter(user);
        activityRepository.deleteByUserId(id);
        messageRepository.deleteAllByUserId(id);

        userRepository.delete(user);
    }

    public boolean checkPassword(String rawPassword, String encodedPassword) {
        return passwordEncoder.matches(rawPassword, encodedPassword);
    }

    public UserDTO convertToDTO(User user) {
        UserDTO dto = new UserDTO(
                user.getId(),
                user.getEmail(),
                user.getFirstName(),
                user.getLastName(),
                user.getPhone(),
                user.getUserType()
        );
            dto.setGender(user.getGender());
            dto.setSchool(user.getSchool());
            dto.setCourse(user.getCourse());
            dto.setYearLevel(user.getYearLevel());
            dto.setStudentId(user.getStudentId());
            dto.setProfileImage(user.getProfileImage());
        dto.setBusinessName(user.getBusinessName());
        dto.setBusinessPermit(user.getBusinessPermit());
        dto.setVerified(user.isVerified());
        dto.setVerificationStatus(user.getVerificationStatus());
        dto.setRejectionReason(user.getRejectionReason());
            dto.setSettings(user.getSettings());
        return dto;
    }

    public UserDTO verifyLandlord(Long userId, boolean approve, String reason) {
        User user = userRepository.findById(userId).orElse(null);
        if (user == null) {
            return null;
        }
        user.setVerificationStatus(approve ? "approved" : "rejected");
        user.setVerified(approve);
        if (!approve && reason != null) {
            user.setRejectionReason(reason);
        }
        userRepository.save(user);
        return convertToDTO(user);
    }
}
