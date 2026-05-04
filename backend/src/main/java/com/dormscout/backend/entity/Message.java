package com.dormscout.backend.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "messages")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Message {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    private String conversationId;

    private boolean isRead = false;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sender_id", nullable = false)
    @JsonIgnore
    private User sender;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "receiver_id", nullable = false)
    @JsonIgnore
    private User receiver;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    @JsonProperty("senderId")
    public Long getSenderId() {
        return sender != null ? sender.getId() : null;
    }

    @JsonProperty("senderName")
    public String getSenderName() {
        if (sender == null) return null;
        String first = sender.getFirstName() != null ? sender.getFirstName().trim() : "";
        String last  = sender.getLastName()  != null ? sender.getLastName().trim()  : "";
        String full  = (first + " " + last).trim();
        return !full.isEmpty() ? full : sender.getEmail();
    }

    @JsonProperty("receiverId")
    public Long getReceiverId() {
        return receiver != null ? receiver.getId() : null;
    }

    @JsonProperty("receiverName")
    public String getReceiverName() {
        if (receiver == null) return null;
        String first = receiver.getFirstName() != null ? receiver.getFirstName().trim() : "";
        String last  = receiver.getLastName()  != null ? receiver.getLastName().trim()  : "";
        String full  = (first + " " + last).trim();
        return !full.isEmpty() ? full : receiver.getEmail();
    }

    @JsonProperty("senderProfileImage")
    public String getSenderProfileImage() {
        return sender != null ? sender.getProfileImage() : null;
    }

    @JsonProperty("receiverProfileImage")
    public String getReceiverProfileImage() {
        return receiver != null ? receiver.getProfileImage() : null;
    }
}