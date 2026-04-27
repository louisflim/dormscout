package com.dormscout.backend.controller;

import com.dormscout.backend.entity.SupportMessage;
import com.dormscout.backend.entity.User;
import com.dormscout.backend.service.SupportMessageService;
import com.dormscout.backend.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/support-messages")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:3001", "http://localhost:3002"})
public class SupportMessageController {
    @Autowired
    private SupportMessageService supportMessageService;

    @Autowired
    private UserService userService;

    @PostMapping
    public ResponseEntity<?> createSupportMessage(@RequestBody SupportMessage supportMessage,
                                                  @RequestParam(required = false) Long userId) {
        try {
            if (userId != null) {
                Optional<User> userOpt = userService.findById(userId);
                if (userOpt.isEmpty()) {
                    return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of(
                        "success", false,
                        "message", "User not found"
                    ));
                }
                supportMessage.setUser(userOpt.get());
            }

            SupportMessage created = supportMessageService.create(supportMessage);
            return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                "success", true,
                "message", "Support message sent",
                "data", created
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of(
                "success", false,
                "message", e.getMessage()
            ));
        }
    }

    @GetMapping
    public ResponseEntity<List<SupportMessage>> getAllSupportMessages() {
        return ResponseEntity.ok(supportMessageService.getAll());
    }

    @GetMapping("/status/{status}")
    public ResponseEntity<List<SupportMessage>> getSupportMessagesByStatus(@PathVariable String status) {
        return ResponseEntity.ok(supportMessageService.getByStatus(status));
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<?> updateStatus(@PathVariable Long id, @RequestParam String status) {
        try {
            SupportMessage updated = supportMessageService.updateStatus(id, status);
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Support message status updated",
                "data", updated
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of(
                "success", false,
                "message", e.getMessage()
            ));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteSupportMessage(@PathVariable Long id) {
        try {
            supportMessageService.delete(id);
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Support message deleted"
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of(
                "success", false,
                "message", "Support message not found"
            ));
        }
    }
}
