package com.dormscout.backend.entity;

import com.dormscout.backend.converter.StringListConverter;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

@Entity
@Table(name = "reviews")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Review {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private int rating;

    @Column(columnDefinition = "TEXT")
    private String body;

    @Convert(converter = StringListConverter.class)
    @Column(columnDefinition = "TEXT")
    private List<String> tags;

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

    /** dormId is an alias for listingId, for frontend compatibility */
    @JsonProperty("dormId")
    public Long getDormId() { return listing != null ? listing.getId() : null; }

    @JsonProperty("listingTitle")
    public String getListingTitle() { return listing != null ? listing.getTitle() : null; }

    @JsonProperty("author")
    public String getAuthor() {
        if (tenant == null) return "Anonymous";
        String fn = tenant.getFirstName(), ln = tenant.getLastName();
        if (fn != null && !fn.isBlank()) {
            return (ln != null && !ln.isBlank()) ? fn + " " + ln : fn;
        }
        return tenant.getEmail();
    }

    @JsonProperty("avatar")
    public String getAvatar() {
        if (tenant == null) return "?";
        String fn = tenant.getFirstName(), ln = tenant.getLastName();
        if (fn != null && !fn.isBlank()) {
            String initials = String.valueOf(fn.charAt(0)).toUpperCase();
            if (ln != null && !ln.isBlank()) initials += String.valueOf(ln.charAt(0)).toUpperCase();
            return initials;
        }
        String email = tenant.getEmail();
        return email != null ? email.substring(0, Math.min(2, email.length())).toUpperCase() : "?";
    }

    @JsonProperty("date")
    public String getDate() {
        if (createdAt == null) return "";
        return createdAt.format(DateTimeFormatter.ofPattern("MMMM d, yyyy", Locale.ENGLISH));
    }

    @JsonProperty("helpful")
    public int getHelpful() { return 0; }

    @JsonProperty("userMarkedHelpful")
    public boolean getUserMarkedHelpful() { return false; }
}