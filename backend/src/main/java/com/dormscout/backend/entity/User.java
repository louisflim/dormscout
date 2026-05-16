package com.dormscout.backend.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Entity
@Table(name = "users")
@JsonIgnoreProperties(ignoreUnknown = true)
@Data
@NoArgsConstructor
@AllArgsConstructor
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)  // accept in requests, hide in responses
    private String password;

    @Column(nullable = false)
    private String firstName;

    private String lastName;
    private String phone;
    private String userType;
    private String gender;
    private String school;
    private String course;
    private String yearLevel;
    private String studentId;
    @Column(columnDefinition = "TEXT")
    private String profileImage;

    @Column(columnDefinition = "TEXT")
    private String bio;

    private String businessName;
    private String businessPermit;
    private boolean isVerified;
    private String verificationStatus; // pending, approved, rejected
    private String rejectionReason;
    private Boolean emailNotifications;
    private Boolean inAppNotifications;
    private Boolean messageAlerts;
    private Boolean darkMode;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "landlord", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore  // BREAKS CIRCULAR REFERENCE
    private List<Listing> listings = new ArrayList<>();

    @OneToMany(mappedBy = "tenant", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore  // Prevents circular reference with Booking → User
    private List<Booking> bookings = new ArrayList<>();

    @JsonProperty("phoneNumber")
    public String getPhoneNumber() {
        return phone;
    }

    @JsonProperty("phoneNumber")
    public void setPhoneNumber(String phoneNumber) {
        this.phone = phoneNumber;
    }

    @JsonProperty("university")
    public String getUniversity() {
        return school;
    }

    @JsonProperty("university")
    public void setUniversity(String university) {
        this.school = university;
    }

    @JsonProperty("settings")
    public Map<String, Boolean> getSettings() {
        Map<String, Boolean> settings = new LinkedHashMap<>();
        settings.put("emailNotifications", emailNotifications == null ? Boolean.TRUE : emailNotifications);
        settings.put("inAppNotifications", inAppNotifications == null ? Boolean.TRUE : inAppNotifications);
        settings.put("messageAlerts", messageAlerts == null ? Boolean.TRUE : messageAlerts);
        settings.put("darkMode", darkMode == null ? Boolean.FALSE : darkMode);
        return settings;
    }

    @JsonProperty("settings")
    public void setSettings(Map<String, Object> settings) {
        if (settings == null) {
            return;
        }

        this.emailNotifications = toBoolean(settings.get("emailNotifications"), this.emailNotifications, true);
        this.inAppNotifications = toBoolean(settings.get("inAppNotifications"), this.inAppNotifications, true);
        this.messageAlerts = toBoolean(settings.get("messageAlerts"), this.messageAlerts, true);
        this.darkMode = toBoolean(settings.get("darkMode"), this.darkMode, false);
    }

    private Boolean toBoolean(Object value, Boolean currentValue, boolean defaultValue) {
        if (value == null) {
            return currentValue != null ? currentValue : defaultValue;
        }
        if (value instanceof Boolean booleanValue) {
            return booleanValue;
        }
        return Boolean.parseBoolean(value.toString());
    }

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}