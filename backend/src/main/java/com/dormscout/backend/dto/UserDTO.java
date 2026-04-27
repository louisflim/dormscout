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
    private String gender;
    private String school;
    private String name;
    private String businessName;
    private String businessPermit;
    private boolean isVerified;
    private String verificationStatus;
    private String verificationDecision;

    public UserDTO(Long id, String email, String firstName, String lastName, String phone, String userType,
                   String gender, String school, String businessName, String businessPermit,
                   boolean isVerified, String verificationStatus, String verificationDecision) {
        this.id = id;
        this.email = email;
        this.firstName = firstName;
        this.lastName = lastName;
        this.phone = phone;
        this.userType = userType;
        this.gender = gender;
        this.school = school;
        this.name = (firstName + " " + (lastName != null ? lastName : "")).trim();
        this.businessName = businessName;
        this.businessPermit = businessPermit;
        this.isVerified = isVerified;
        this.verificationStatus = verificationStatus;
        this.verificationDecision = verificationDecision;
    }
}
