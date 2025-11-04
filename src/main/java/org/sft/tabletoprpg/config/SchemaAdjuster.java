package org.sft.tabletoprpg.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class SchemaAdjuster implements ApplicationRunner {

    private final JdbcTemplate jdbcTemplate;

    @Override
    public void run(ApplicationArguments args) {
        // Make journal_entries.type nullable
        try {
            jdbcTemplate.execute("ALTER TABLE journal_entries ALTER COLUMN type DROP NOT NULL");
            log.info("Adjusted schema: journal_entries.type set to NULLABLE");
        } catch (Exception ex) {
            log.debug("Schema adjust (type nullable) skipped: {}", ex.getMessage());
        }

        // Make journal_entries.campaign_id nullable (for personal journals)
        try {
            jdbcTemplate.execute("ALTER TABLE journal_entries ALTER COLUMN campaign_id DROP NOT NULL");
            log.info("Adjusted schema: journal_entries.campaign_id set to NULLABLE");
        } catch (Exception ex) {
            log.debug("Schema adjust (campaign_id nullable) skipped: {}", ex.getMessage());
        }
    }
}


