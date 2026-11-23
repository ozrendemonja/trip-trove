package com.triptrove.manager;

import com.triptrove.manager.domain.model.ItineraryTiming;
import liquibase.Contexts;
import liquibase.LabelExpression;
import liquibase.Liquibase;
import liquibase.database.DatabaseFactory;
import liquibase.database.jvm.JdbcConnection;
import liquibase.integration.spring.SpringResourceAccessor;
import org.junit.jupiter.api.Test;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.DefaultResourceLoader;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.DriverManagerDataSource;
import org.springframework.jdbc.datasource.init.ScriptUtils;
import org.testcontainers.postgresql.PostgreSQLContainer;

import javax.sql.DataSource;
import java.time.LocalDate;
import java.time.LocalTime;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class ItineraryMigrationTest {
    private static final String CHANGELOG = "db/changelog/db.changelog-master.yaml";
    private static final int PRE_ITINERARY_CHANGESETS = 13;

    @Test
    void backfillsExistingTripsWithoutChangingSavedPlanningOrOverwritingItinerariesOnRerun() throws Exception {
        try (var postgres = new PostgreSQLContainer("postgres:17-alpine")) {
            postgres.start();
            var source = new DriverManagerDataSource(postgres.getJdbcUrl(), postgres.getUsername(), postgres.getPassword());
            migrateToLegacySchema(source);
            try (var connection = source.getConnection()) {
                ScriptUtils.executeSqlScript(connection, new ClassPathResource("db/attractions-test-data.sql"));
            }
            var jdbc = new JdbcTemplate(source);
            jdbc.update("DELETE FROM trip_attraction WHERE trip_id <> 1");
            jdbc.update("DELETE FROM trip WHERE id <> 1");
            jdbc.update("""
                    UPDATE trip SET name = 'Archived', trip_start_date = '2024-08-31', trip_end_date = '2024-09-02'
                    WHERE id = 1
                    """);
            jdbc.update("""
                    INSERT INTO trip (name, trip_start_date, trip_end_date, created_on, archived) VALUES
                       ('Past empty board', '2025-01-01', '2025-01-01', '2024-01-01', false),
                       ('Active empty board', '2099-12-31', '2100-01-01', '2024-01-01', false)
                    """);
            jdbc.update("""
                    UPDATE trip_attraction
                    SET working_hours = 'Mon by request', visit_time = 'as long as needed',
                        note = 'Trip note', status = 'VISITED', review_note = 'Visit note', would_visit_again = true
                    WHERE trip_id = 1 AND attraction_id = 1
                    """);
            var tripRows = jdbc.queryForList("SELECT to_jsonb(t)::text FROM trip t ORDER BY t.id", String.class);
            var boardRows = jdbc.queryForList("SELECT to_jsonb(ta)::text FROM trip_attraction ta ORDER BY ta.id", String.class);

            migrate(source);

            assertThat(jdbc.queryForList("""
                    SELECT t.name || ': ' || d.date FROM trip t JOIN itinerary_day d ON d.trip_id = t.id
                    ORDER BY t.id, d.date
                    """, String.class)).containsExactly(
                    "Archived: 2024-08-31", "Archived: 2024-09-01", "Archived: 2024-09-02",
                    "Past empty board: 2025-01-01",
                    "Active empty board: 2099-12-31", "Active empty board: 2100-01-01");
            assertThat(jdbc.queryForObject("SELECT count(*) FROM itinerary", Integer.class)).isEqualTo(3);
            assertThat(jdbc.queryForObject("""
                    SELECT count(*) FROM itinerary WHERE time_zone IS NOT NULL OR last_checked_at IS NOT NULL
                    """, Integer.class)).isZero();
            assertThat(jdbc.queryForList("SELECT to_jsonb(t)::text FROM trip t ORDER BY t.id", String.class))
                    .containsExactlyElementsOf(tripRows);
            assertThat(jdbc.queryForList("SELECT to_jsonb(ta)::text FROM trip_attraction ta ORDER BY ta.id", String.class))
                    .containsExactlyElementsOf(boardRows);

            jdbc.update("""
                    UPDATE itinerary SET time_zone = 'Europe/Belgrade', last_checked_at = '2025-04-03T10:00:00Z'
                    WHERE trip_id = 1
                    """);
            var itineraries = jdbc.queryForList("SELECT to_jsonb(i)::text FROM itinerary i ORDER BY i.trip_id", String.class);
            var days = jdbc.queryForList("SELECT to_jsonb(d)::text FROM itinerary_day d ORDER BY d.id", String.class);

            jdbc.update("DELETE FROM databasechangelog WHERE id = '0012-create-itinerary'");
            migrate(source);

            assertThat(jdbc.queryForList("SELECT to_jsonb(i)::text FROM itinerary i ORDER BY i.trip_id", String.class))
                    .containsExactlyElementsOf(itineraries);
            assertThat(jdbc.queryForList("SELECT to_jsonb(d)::text FROM itinerary_day d ORDER BY d.id", String.class))
                    .containsExactlyElementsOf(days);
        }
    }

    @Test
    void createsLocalClockEntriesAndPreservesSavedTimingOnRerun() throws Exception {
        try (var postgres = new PostgreSQLContainer("postgres:17-alpine")) {
            postgres.start();
            var source = new DriverManagerDataSource(postgres.getJdbcUrl(), postgres.getUsername(), postgres.getPassword());
            migrate(source);
            try (var connection = source.getConnection()) {
                ScriptUtils.executeSqlScript(connection, new ClassPathResource("db/attractions-test-data.sql"));
            }
            var jdbc = new JdbcTemplate(source);
            jdbc.update("INSERT INTO itinerary(trip_id, time_zone) VALUES (1, 'Europe/Belgrade')");
            jdbc.update("INSERT INTO itinerary_day(trip_id, date) VALUES (1, '2027-10-31')");
            jdbc.update("""
                    INSERT INTO itinerary_entry(trip_id, date, attraction_id, path_position, zone_id,
                        start_time, second_start_occurrence, planned_minutes, fixed_start)
                    VALUES (1, '2027-10-31', 1, 1, 'Europe/Belgrade', '02:30', false, 30, false),
                           (1, '2027-10-31', 2, 2, 'Europe/Belgrade', '02:30', true, 30, false),
                           (1, '2027-10-31', 3, 3, 'Asia/Bangkok', '10:00:15.123456', null, 120, false)
                    """);

            jdbc.update("DELETE FROM databasechangelog WHERE id = '0012-create-itinerary'");
            migrate(source);

            assertThat(jdbc.queryForList("""
                    SELECT column_name FROM information_schema.columns
                    WHERE table_schema = 'public' AND table_name = 'itinerary_entry'
                    """, String.class))
                    .contains("date", "start_time", "second_start_occurrence", "planned_minutes")
                    .doesNotContain("start_local", "start_offset_seconds", "end_local", "end_offset_seconds");
            assertThat(jdbc.queryForList("""
                    SELECT second_start_occurrence FROM itinerary_entry ORDER BY path_position
                    """, Boolean.class)).containsExactly(false, true, null);
            assertThat(jdbc.queryForList("""
                    SELECT (date + start_time)::text || '/' || planned_minutes FROM itinerary_entry ORDER BY path_position
                    """, String.class)).containsExactly("2027-10-31 02:30:00/30", "2027-10-31 02:30:00/30",
                    "2027-10-31 10:00:15.123456/120");
            var museum = jdbc.queryForObject("""
                    SELECT zone_id, date, start_time, second_start_occurrence, planned_minutes
                    FROM itinerary_entry WHERE attraction_id = 3
                    """, (rs, row) -> new ItineraryTiming(rs.getString("zone_id"),
                    rs.getObject("date", LocalDate.class), rs.getObject("start_time", LocalTime.class),
                    rs.getObject("second_start_occurrence", Boolean.class), rs.getInt("planned_minutes")));
            assertThat(museum.start().toString()).isEqualTo("2027-10-31T10:00:15.123456+07:00");
            assertThat(museum.end().toString()).isEqualTo("2027-10-31T12:00:15.123456+07:00");
        }
    }

    @Test
    void reportsInvalidDatesWithoutCreatingItineraryTables() throws Exception {
        try (var postgres = new PostgreSQLContainer("postgres:17-alpine")) {
            postgres.start();
            var source = new DriverManagerDataSource(postgres.getJdbcUrl(), postgres.getUsername(), postgres.getPassword());
            migrateToLegacySchema(source);
            var jdbc = new JdbcTemplate(source);
            jdbc.update("""
                    INSERT INTO trip (id, name, trip_start_date, trip_end_date, created_on, archived) VALUES
                       (31, 'Reversed', '2025-03-02', '2025-03-01', '2024-01-01', false),
                       (32, 'Infinite', '2025-03-01', 'infinity', '2024-01-01', false),
                       (33, 'Valid', '2025-03-01', '2025-03-01', '2024-01-01', false)
                    """);

            assertThatThrownBy(() -> migrate(source))
                    .hasStackTraceContaining("Invalid saved trip dates; cannot initialize itineraries")
                    .hasStackTraceContaining("31 (2025-03-02 to 2025-03-01)")
                    .hasStackTraceContaining("32 (2025-03-01 to infinity)");
            assertThat(jdbc.queryForObject("""
                    SELECT count(*) FROM information_schema.tables
                    WHERE table_schema = 'public' AND table_name IN ('itinerary', 'itinerary_day', 'itinerary_entry')
                    """, Integer.class)).isZero();
        }
    }

    private static void migrateToLegacySchema(DataSource source) throws Exception {
        try (var liquibase = openChangelog(source)) {
            liquibase.update(PRE_ITINERARY_CHANGESETS, new Contexts(), new LabelExpression());
        }
    }

    private static void migrate(DataSource source) throws Exception {
        try (var liquibase = openChangelog(source)) {
            liquibase.update(new Contexts(), new LabelExpression());
        }
    }

    private static Liquibase openChangelog(DataSource source) throws Exception {
        var database = DatabaseFactory.getInstance()
                .findCorrectDatabaseImplementation(new JdbcConnection(source.getConnection()));
        return new Liquibase(CHANGELOG, new SpringResourceAccessor(new DefaultResourceLoader()), database);
    }
}
