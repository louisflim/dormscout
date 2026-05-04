package com.dormscout.backend.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "bookmarks")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Bookmark {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tenant_id", nullable = false)
    @JsonIgnore
    private User tenant;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "listing_id", nullable = false)
    @JsonIgnore
    private Listing listing;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    @JsonProperty("tenantId")
    public Long getTenantId() { return tenant != null ? tenant.getId() : null; }

    @JsonProperty("listingId")
    public Long getListingId() { return listing != null ? listing.getId() : null; }

    @JsonProperty("listingTitle")
    public String getListingTitle() { return listing != null ? listing.getTitle() : null; }

    @JsonProperty("listingAddress")
    public String getListingAddress() { return listing != null ? listing.getAddress() : null; }

    @JsonProperty("listingPrice")
    public Double getListingPrice() { return listing != null ? listing.getPrice() : null; }

    @JsonProperty("lat")
    public Double getLat() { return listing != null ? listing.getLatitude() : null; }

    @JsonProperty("lng")
    public Double getLng() { return listing != null ? listing.getLongitude() : null; }

    @JsonProperty("listingImages")
    public List<String> getListingImages() {
        if (listing == null || listing.getImages() == null) return new ArrayList<>();
        return listing.getImages();
    }

    @JsonProperty("landlordName")
    public String getLandlordName() { return listing != null ? listing.getLandlordName() : null; }

    @JsonProperty("university")
    public String getUniversity() { return listing != null ? listing.getUniversity() : null; }

    @JsonProperty("genderPolicy")
    public String getGenderPolicy() { return listing != null ? listing.getGenderPolicy() : null; }

    @JsonProperty("tags")
    public List<String> getTags() {
        if (listing == null || listing.getTags() == null) return new ArrayList<>();
        return listing.getTags();
    }

    @JsonProperty("savedAt")
    public String getSavedAt() { return createdAt != null ? createdAt.toString() : null; }
}