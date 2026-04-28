package com.dormscout.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RegisterRequest {
    private String email;
    private String password;           // No @JsonIgnore here
    private String firstName;
    private String lastName;
    private String phone;
    private String userType;           // "STUDENT" or "LANDLORD"
    private String gender;
    private String school;
    private String course;
    private String yearLevel;
    private String studentId;
    private String businessName;
    private String businessPermit;
}