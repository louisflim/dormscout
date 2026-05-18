package com.dormscout.backend.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "reports")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Report {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String reportType;

    @Column(nullable = false)
    private String subject;

    @Column(nullable = false)
    private String reason;

    @Column(columnDefinition = "LONGTEXT")
    private String description;

    /** Base64 evidence images exceed MySQL TEXT (64KB); use LONGTEXT. */
    @Column(columnDefinition = "LONGTEXT")
    private String evidence;

    private String status = "pending";

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reporter_id", nullable = false)
    @JsonIgnore
    private User reporter;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (status == null) status = "pending";
    }

    @JsonProperty("reporterId")
    public Long getReporterId() { return reporter != null ? reporter.getId() : null; }

    @JsonProperty("reporterName")
    public String getReporterName() {
        if (reporter == null) return null;
        String fn = reporter.getFirstName(), ln = reporter.getLastName();
        if (fn != null && !fn.isBlank()) {
            return (ln != null && !ln.isBlank()) ? fn + " " + ln : fn;
        }
        return reporter.getEmail();
    }
}