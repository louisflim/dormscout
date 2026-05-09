package com.dormscout.backend.entity;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "bookings")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Booking {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String status; // "pending", "approved", "rejected"

    @JsonAlias({ "moveInDate" })
    private LocalDate checkInDate;

    private LocalDate checkOutDate;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // Relationships
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tenant_id", nullable = false)
    private User tenant;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "listing_id", nullable = false)
    private Listing listing;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (status == null) {
            status = "pending";
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    @JsonProperty("tenantName")
    public String getTenantName() {
        if (tenant == null) return null;
        String first = tenant.getFirstName() != null ? tenant.getFirstName().trim() : "";
        String last = tenant.getLastName() != null ? tenant.getLastName().trim() : "";
        String fullName = (first + " " + last).trim();
        return fullName.isEmpty() ? tenant.getEmail() : fullName;
    }

    @JsonProperty("listingTitle")
    public String getListingTitle() {
        return listing != null ? listing.getTitle() : null;
    }

    @JsonProperty("moveInDate")
    public LocalDate getMoveInDate() {
        return checkInDate;
    }

    @JsonProperty("room")
    public String getRoom() {
        return listing != null ? listing.getRooms() : null;
    }

    @JsonProperty("landlord")
    public String getLandlord() {
        return listing != null ? listing.getLandlordName() : null;
    }

    @JsonProperty("price")
    public Double getPrice() {
        return listing != null ? listing.getPrice() : null;
    }

    @JsonProperty("listingId")
    public Long getListingId() {
        return listing != null ? listing.getId() : null;
    }
}
