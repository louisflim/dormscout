package com.dormscout.backend.controller;

import com.dormscout.backend.entity.Activity;
import com.dormscout.backend.response.ApiResponse;
import com.dormscout.backend.service.ActivityService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/activities")
@CrossOrigin(origins = "http://localhost:3000")
public class ActivityController {
    @Autowired
    private ActivityService activityService;

    @PostMapping
    public ResponseEntity<ApiResponse<Activity>> createActivity(
            @RequestParam Long userId,
            @RequestParam String type,
            @RequestParam String text,
            @RequestParam(required = false) String time,
            @RequestParam(required = false) String nav) {
        try {
            Activity activity = activityService.createActivity(userId, type, text, time, nav);
            return ResponseEntity.status(HttpStatus.CREATED).body(
                    ApiResponse.success("Activity created", activity)
            );
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(
                    ApiResponse.error("Error: " + e.getMessage())
            );
        }
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<ApiResponse<List<Activity>>> getActivitiesByUser(@PathVariable Long userId) {
        try {
            List<Activity> activities = activityService.getActivitiesByUser(userId);
            return ResponseEntity.ok(ApiResponse.success("Activities retrieved", activities));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(
                    ApiResponse.error("Error: " + e.getMessage())
            );
        }
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<ApiResponse<Void>> markAsRead(@PathVariable Long id) {
        activityService.markAsRead(id);
        return ResponseEntity.ok(ApiResponse.success("Marked as read", null));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteActivity(@PathVariable Long id) {
        activityService.deleteActivity(id);
        return ResponseEntity.ok(ApiResponse.success("Activity deleted", null));
    }
}