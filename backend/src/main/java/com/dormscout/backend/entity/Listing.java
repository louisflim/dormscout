package com.dormscout.backend.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.dormscout.backend.converter.StringListConverter;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "listings")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Listing {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    private String address;

    private Double latitude;

    private Double longitude;

    private Double price;

    private Integer totalRooms;

    private Integer availableRooms;

    @Column(columnDefinition = "LONGTEXT")
    private String description;

    private String status; // "Active", "Inactive"

    @Convert(converter = StringListConverter.class)
    @Column(columnDefinition = "TEXT")
    private List<String> tags;

    @Convert(converter = StringListConverter.class)
    @Column(columnDefinition = "LONGTEXT")
    private List<String> images;

    private String rooms;   // "Single Room", "Double Room", etc.

    private String university;

    private String genderPolicy; // "Girls Only", "Boys Only", "Mixed"

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // Relationships
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "landlord_id", nullable = false)
    @JsonIgnore  // BREAKS CIRCULAR REFERENCE
    private User landlord;

    @JsonProperty("landlordId")
    public Long getLandlordId() {
        return landlord != null ? landlord.getId() : null;
    }

    @JsonProperty("landlordName")
    public String getLandlordName() {
        if (landlord == null) {
            return null;
        }

        String first = landlord.getFirstName() != null ? landlord.getFirstName().trim() : "";
        String last = landlord.getLastName() != null ? landlord.getLastName().trim() : "";
        String fullName = (first + " " + last).trim();

        if (!fullName.isEmpty()) {
            return fullName;
        }

        return landlord.getEmail();
    }

    @OneToMany(mappedBy = "listing", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore  // Prevents circular reference with Booking → Listing
    private List<Booking> bookings = new ArrayList<>();

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (status == null) {
            status = "Active";
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}