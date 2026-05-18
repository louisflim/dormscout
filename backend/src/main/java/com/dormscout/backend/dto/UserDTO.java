package com.dormscout.backend.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.LinkedHashMap;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserDTO {
    private Long id;
    private String email;
    private String firstName;
    private String lastName;
    private String phone;
    private String userType;
    private String name;
    private String gender;
    private String school;
    private String course;
    private String yearLevel;
    private String studentId;
    private String profileImage;
    private String bio;
    private String businessName;
    private String businessPermit;
    private String pendingBusinessName;
    private String pendingBusinessPermit;
    private String businessUpdateStatus;
    private String businessUpdateRejectionReason;
    private boolean verified;
    private String verificationStatus; // pending, approved, rejected
    private String rejectionReason;
    private Map<String, Boolean> settings = new LinkedHashMap<>();

    public UserDTO(Long id, String email, String firstName, String lastName, String phone, String userType) {
        this.id = id;
        this.email = email;
        this.firstName = firstName;
        this.lastName = lastName;
        this.phone = phone;
        this.userType = userType;
        this.name = (firstName + " " + (lastName != null ? lastName : "")).trim();
        this.verified = false;
        this.verificationStatus = null;
        this.rejectionReason = null;
    }

    @JsonProperty("phoneNumber")
    public String getPhoneNumber() {
        return phone;
    }

    @JsonProperty("university")
    public String getUniversity() {
        return school;
    }
}
