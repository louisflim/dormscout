package com.dormscout.backend.controller;

import com.dormscout.backend.entity.University;
import com.dormscout.backend.service.UniversityService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/universities")
@CrossOrigin(origins = "http://localhost:3000")
public class UniversityController {
    @Autowired
    private UniversityService universityService;

    @GetMapping
    public ResponseEntity<List<University>> getAllUniversities() {
        return ResponseEntity.ok(universityService.getAllUniversities());
    }

    @PostMapping
    public ResponseEntity<University> addUniversity(@RequestBody University university) {
        return ResponseEntity.ok(universityService.addUniversity(university));
    }
}