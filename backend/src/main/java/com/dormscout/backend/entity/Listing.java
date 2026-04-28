package com.dormscout.backend.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
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

    @Column(columnDefinition = "TEXT")
    private String description;

    private String status; // "Active", "Inactive"

    @Convert(converter = StringListConverter.class)
    @Column(columnDefinition = "TEXT")
    private List<String> tags;

    @Convert(converter = StringListConverter.class)
    @Column(columnDefinition = "TEXT")
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