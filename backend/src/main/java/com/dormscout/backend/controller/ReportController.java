package com.dormscout.backend.controller;

import com.dormscout.backend.entity.Report;
import com.dormscout.backend.entity.User;
import com.dormscout.backend.service.ReportService;
import com.dormscout.backend.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/reports")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:3001", "http://localhost:3002"})
public class ReportController {
    @Autowired
    private ReportService reportService;

    @Autowired
    private UserService userService;

    @PostMapping
    public ResponseEntity<?> fileReport(@RequestBody Report report,
                                        @RequestParam Long reporterId) {
        try {
            Optional<User> reporterOpt = userService.findById(reporterId);
            if (!reporterOpt.isPresent()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of(
                    "success", false, "message", "Reporter not found"
                ));
            }

            report.setReporter(reporterOpt.get());
            Report filed = reportService.fileReport(report);
            return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                "success", true, "message", "Report filed", "data", filed
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of(
                "success", false, "message", e.getMessage()
            ));
        }
    }

    @GetMapping
    public ResponseEntity<List<Report>> getAllReports() {
        return ResponseEntity.ok(reportService.getAllReports());
    }

    @GetMapping("/status/{status}")
    public ResponseEntity<List<Report>> getByStatus(@PathVariable String status) {
        return ResponseEntity.ok(reportService.getReportsByStatus(status));
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<?> updateStatus(@PathVariable Long id,
                                          @RequestParam String status) {
        try {
            Report updated = reportService.updateReportStatus(id, status);
            return ResponseEntity.ok(Map.of(
                "success", true, "message", "Status updated", "data", updated
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of(
                "success", false, "message", e.getMessage()
            ));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteReport(@PathVariable Long id) {
        try {
            reportService.deleteReport(id);
            return ResponseEntity.ok(Map.of("success", true, "message", "Report deleted"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of(
                "success", false, "message", "Report not found"
            ));
        }
    }
}