package com.dormscout.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

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
    private String businessName;
    private String businessPermit;
    private boolean verified;
    private String verificationStatus; // pending, approved, rejected
    private String rejectionReason;

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
}
