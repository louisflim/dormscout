package com.dormscout.backend.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * Ensures report text columns can store base64 evidence photos (MySQL TEXT caps at ~64KB).
 */
@Component
public class ReportSchemaMigrator implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(ReportSchemaMigrator.class);

    private final JdbcTemplate jdbcTemplate;

    public ReportSchemaMigrator(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public void run(ApplicationArguments args) {
        try {
            jdbcTemplate.execute("ALTER TABLE reports MODIFY COLUMN evidence LONGTEXT");
            jdbcTemplate.execute("ALTER TABLE reports MODIFY COLUMN description LONGTEXT");
            log.debug("Reports table columns verified (LONGTEXT for evidence/description)");
        } catch (Exception e) {
            log.warn("Could not migrate reports table columns: {}", e.getMessage());
        }
    }
}
