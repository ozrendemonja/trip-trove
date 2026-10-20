package com.triptrove.manager;

import com.triptrove.manager.KeysetTestFixtures.CursorRoute;
import jakarta.transaction.Transactional;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.context.jdbc.Sql;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.Map;
import java.util.stream.Stream;

import static com.triptrove.manager.KeysetTestFixtures.CHANGED_ON;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@Transactional
@AutoConfigureMockMvc
@Sql(value = "/db/attractions-test-data.sql", executionPhase = Sql.ExecutionPhase.BEFORE_TEST_CLASS)
class PaginationValidationTest extends AbstractIntegrationTest {
    private static final String INCOMPLETE_CURSOR_ERROR =
            "{cursorComplete = Both the identifier and updatedOn must be provided together}";

    @Autowired
    private MockMvc mockMvc;

    @ParameterizedTest
    @MethodSource("partialCursors")
    void partialCursorsHaveExactValidationErrors(String path, String field, String value) throws Exception {
        mockMvc.perform(get(path).header("x-api-version", "1").param(field, value))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errorCode").value("BAD_REQUEST"))
                .andExpect(jsonPath("$.errorMessage").value(INCOMPLETE_CURSOR_ERROR));
    }

    private static Stream<Arguments> partialCursors() {
        return KeysetTestFixtures.cursorRoutes()
                .flatMap(route -> Stream.of(
                        Arguments.of(route.path(), route.idField(), "1"),
                        Arguments.of(route.path(), "updatedOn", "2026-09-28T12:00:00.123456")));
    }

    @ParameterizedTest
    @MethodSource("invalidCursors")
    void returnsBadRequestWhenCursorParametersAreInvalid(
            CursorRoute route, String identifier, String timestamp, String message) throws Exception {
        mockMvc.perform(get(route.path()).header("x-api-version", "1")
                        .param(route.idField(), identifier).param("updatedOn", timestamp))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errorCode").value("BAD_REQUEST"))
                .andExpect(jsonPath("$.errorMessage").value(message));
    }

    private static Stream<Arguments> invalidCursors() {
        var bindingRoutes = List.of("/countries", "/attractions");
        var overflows = Map.of("Integer", "2147483648", "Long", "9223372036854775808");
        var bindingCases = KeysetTestFixtures.cursorRoutes().filter(route -> bindingRoutes.contains(route.path())).flatMap(route -> {
            var positiveMessage = "{" + route.idField() + " = must be greater than 0}";
            var identifierMessage = "{" + route.idField() + " = must be a valid " + route.idType() + " value}";
            var timestampMessage = "{updatedOn = must be a valid ISO date-time value}";
            return Stream.of(
                    Arguments.of(route, "0", CHANGED_ON, positiveMessage),
                    Arguments.of(route, "-1", CHANGED_ON, positiveMessage),
                    Arguments.of(route, "", CHANGED_ON, INCOMPLETE_CURSOR_ERROR),
                    Arguments.of(route, "   ", CHANGED_ON, INCOMPLETE_CURSOR_ERROR),
                    Arguments.of(route, "not-an-id", CHANGED_ON, identifierMessage),
                    Arguments.of(route, overflows.get(route.idType()), CHANGED_ON, identifierMessage),
                    Arguments.of(route, "1", "", INCOMPLETE_CURSOR_ERROR),
                    Arguments.of(route, "1", "   ", INCOMPLETE_CURSOR_ERROR),
                    Arguments.of(route, "1", "not-a-timestamp", timestampMessage),
                    Arguments.of(route, "1", "2026-02-30T12:00:00", timestampMessage));
        });
        var routeValidation = KeysetTestFixtures.cursorRoutes().filter(route -> !bindingRoutes.contains(route.path()))
                .map(route -> Arguments.of(route, "0", CHANGED_ON,
                        "{" + route.idField() + " = must be greater than 0}"));
        return Stream.concat(bindingCases, routeValidation);
    }

    @ParameterizedTest
    @MethodSource("invalidDirections")
    void returnsBadRequestWhenSortDirectionIsUnsupported(String path, String direction) throws Exception {
        mockMvc.perform(get(path).header("x-api-version", "1").param("sd", direction))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errorCode").value("BAD_REQUEST"))
                .andExpect(jsonPath("$.errorMessage").value("Parameter 'sd' must be one of [ASC, DESC]."));
    }

    private static Stream<Arguments> invalidDirections() {
        return Stream.of("/countries", "/regions", "/cities", "/attractions", "/trips", "/bucket-list/items")
                .map(path -> Arguments.of(path, "SIDEWAYS"));
    }
}
