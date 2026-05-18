package com.dormscout.backend.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * Ensures text columns can store base64 photos (MySQL TEXT caps at ~64KB).
 * Hibernate ddl-auto=update does not always widen existing columns.
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
        migrate("reports", "evidence", "ALTER TABLE reports MODIFY COLUMN evidence LONGTEXT");
        migrate("reports", "description", "ALTER TABLE reports MODIFY COLUMN description LONGTEXT");
        migrate("listings", "images", "ALTER TABLE listings MODIFY COLUMN images LONGTEXT");
        migrate("listings", "description", "ALTER TABLE listings MODIFY COLUMN description LONGTEXT");
        migrate("users", "profile_image", "ALTER TABLE users MODIFY COLUMN profile_image LONGTEXT");
        addColumnIfMissing("users", "pending_business_name",
                "ALTER TABLE users ADD COLUMN pending_business_name VARCHAR(255) NULL");
        addColumnIfMissing("users", "pending_business_permit",
                "ALTER TABLE users ADD COLUMN pending_business_permit VARCHAR(255) NULL");
        addColumnIfMissing("users", "business_update_status",
                "ALTER TABLE users ADD COLUMN business_update_status VARCHAR(32) NULL");
        addColumnIfMissing("users", "business_update_rejection_reason",
                "ALTER TABLE users ADD COLUMN business_update_rejection_reason TEXT NULL");
    }

    private void addColumnIfMissing(String table, String column, String sql) {
        try {
            Integer count = jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM information_schema.COLUMNS "
                            + "WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?",
                    Integer.class,
                    table,
                    column
            );
            if (count != null && count == 0) {
                jdbcTemplate.execute(sql);
                log.info("Added column {}.{}", table, column);
            }
        } catch (Exception e) {
            log.warn("Could not add column {}.{}: {}", table, column, e.getMessage());
        }
    }

    private void migrate(String table, String column, String sql) {
        try {
            jdbcTemplate.execute(sql);
            log.debug("{} table column {} verified (LONGTEXT)", table, column);
        } catch (Exception e) {
            log.warn("Could not migrate {}.{}: {}", table, column, e.getMessage());
        }
    }
}
