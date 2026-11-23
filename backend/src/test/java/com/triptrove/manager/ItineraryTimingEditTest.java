package com.triptrove.manager;

import jakarta.transaction.Transactional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.json.JsonCompareMode;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;

import static org.hamcrest.Matchers.contains;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@Transactional
@AutoConfigureMockMvc
class ItineraryTimingEditTest extends AbstractIntegrationTest {
    private static final String ITINERARY = "/trips/1/itinerary";
    private static final String DAY = "2027-03-29";
    private static final String TOMORROW = "2027-03-30";

    @Autowired
    private MockMvc mockMvc;

    @Test
    void movingFixedStartWithoutBoardDuration_keepsLockAndLength() throws Exception {
        seedTrip(DAY, DAY);
        var museum = entry(1, "Museum", DAY, 1, "09:00", 30, true, null);

        putStart(museum, "09:30").andExpect(status().isNoContent())
                .andExpect(header().string(HttpHeaders.LOCATION, "http://localhost" + ITINERARY))
                .andExpect(content().string(""));

        saved().andExpect(jsonPath("$.days[0].entries[0].entryId").value(museum))
                .andExpect(jsonPath("$.days[0].entries[0].fixedStart").value(true))
                .andExpect(jsonPath("$.days[0].entries[0].timing.start").value(DAY + "T09:30+02:00"))
                .andExpect(jsonPath("$.days[0].entries[0].timing.end").value(DAY + "T10:00+02:00"))
                .andExpect(jsonPath("$.checkState").value("NOT_YET_CHECKED"))
                .andExpect(jsonPath("$.changeNotices").isEmpty());
    }

    @Test
    void plannedLengthEditWithoutBoardDuration_isRejected() throws Exception {
        seedTrip(DAY, DAY);
        var museum = entry(1, "Museum", DAY, 1, "09:30", 30, true, null);

        rejected(putPlannedLength(museum, 45),
                "Set a valid visit duration for Museum on the board before changing its planned length.");
    }

    @Test
    void endWithinGap_keepsNextVisitInPlace() throws Exception {
        var museum = seedMorningVisits(30, "10:00", "10:45");

        putEnd(museum, DAY, "09:50").andExpect(status().isNoContent());
        saved().andExpect(jsonPath("$.days[0].entries[1].timing.end").value(DAY + "T09:50+02:00"))
                .andExpect(jsonPath("$.days[0].entries[2].timing.start").value(DAY + "T10:00+02:00"))
                .andExpect(jsonPath("$.days[0].entries[3].timing.start").value(DAY + "T10:45+02:00"));
    }

    @Test
    void endPastNextStart_movesOnlyTheOverlappingVisit() throws Exception {
        var museum = seedMorningVisits(50, "10:00", "10:45");

        putEnd(museum, DAY, "10:15").andExpect(status().isNoContent());
        saved().andExpect(jsonPath("$.days[0].entries[1].timing.end").value(DAY + "T10:15+02:00"))
                .andExpect(jsonPath("$.days[0].entries[2].timing.start").value(DAY + "T10:15+02:00"))
                .andExpect(jsonPath("$.days[0].entries[3].timing.start").value(DAY + "T10:45+02:00"));
    }

    @Test
    void increasingPlannedLength_pushesOverlappingVisitsUntilNextGap() throws Exception {
        var museum = seedMorningVisits(75, "10:15", "10:45");

        putPlannedLength(museum, 90).andExpect(status().isNoContent());
        saved().andExpect(jsonPath("$.days[0].entries[*].timing.start", contains(DAY + "T08:00+02:00",
                        DAY + "T09:00+02:00", DAY + "T10:30+02:00", DAY + "T11:00+02:00", DAY + "T12:00+02:00")))
                .andExpect(jsonPath("$.days[0].entries[2].timing.end").value(DAY + "T11:00+02:00"))
                .andExpect(jsonPath("$.days[0].entries[3].timing.end").value(DAY + "T11:15+02:00"));
    }

    @Test
    void shorteningVisit_leavesLaterStartsUnchanged() throws Exception {
        var museum = seedMorningVisits(90, "10:30", "11:00");

        putEnd(museum, DAY, "09:25").andExpect(status().isNoContent());
        saved().andExpect(jsonPath("$.days[0].entries[1].timing.end").value(DAY + "T09:25+02:00"))
                .andExpect(jsonPath("$.days[0].entries[*].timing.start", contains(DAY + "T08:00+02:00",
                        DAY + "T09:00+02:00", DAY + "T10:30+02:00", DAY + "T11:00+02:00", DAY + "T12:00+02:00")));
    }

    @Test
    void movingStartEarlier_leavesLaterStartsUnchanged() throws Exception {
        var museum = seedMorningVisits(25, "10:30", "11:00");

        putStart(museum, "08:45").andExpect(status().isNoContent());
        saved().andExpect(jsonPath("$.days[0].entries[*].timing.start", contains(DAY + "T08:00+02:00",
                        DAY + "T08:45+02:00", DAY + "T10:30+02:00", DAY + "T11:00+02:00", DAY + "T12:00+02:00")))
                .andExpect(jsonPath("$.days[0].entries[1].fixedStart").value(false))
                .andExpect(jsonPath("$.days[0].entries[1].timing.end").value(DAY + "T09:10+02:00"));
    }

    private long seedMorningVisits(int museumMinutes, String gardenStart, String galleryStart) {
        seedTrip(DAY, DAY);
        entry(1, "Market", DAY, 1, "08:00", 30, false, "30m");
        var museum = entry(2, "Museum", DAY, 2, "09:00", museumMinutes, false, "15-90m");
        entry(3, "Garden", DAY, 3, gardenStart, 30, false, "30m");
        entry(4, "Gallery", DAY, 4, galleryStart, 15, false, "15m");
        entry(5, "Lookout", DAY, 5, "12:00", 30, true, "30m");
        return museum;
    }

    @ParameterizedTest
    @CsvSource(delimiter = '|', textBlock = """
            planned-length | {"plannedMinutes":44}
            end            | {"endDate":"2027-03-29","endTime":"10:01"}
            """)
    void lengthOutsideBoardDuration_isRejectedWithoutChangingEnd(String field, String request) throws Exception {
        seedTrip(DAY, DAY);
        var museum = entry(1, "Museum", DAY, 1, "09:00", 30, false, "45m-1h");

        rejected(putTiming(museum, field, request),
                "The planned length for Museum must be within its current visit duration (45m-1h).");
        saved().andExpect(jsonPath("$.days[0].entries[0].timing.end").value(DAY + "T09:30+02:00"));
    }

    @Test
    void endAtMinimumVisitDuration_isAccepted() throws Exception {
        seedTrip(DAY, DAY);
        var museum = entry(1, "Museum", DAY, 1, "09:00", 30, false, "45m-1h");

        putEnd(museum, DAY, "09:45").andExpect(status().isNoContent());
        saved().andExpect(jsonPath("$.days[0].entries[0].timing.end").value(DAY + "T09:45+02:00"));
    }

    @ParameterizedTest
    @CsvSource(delimiter = '|', textBlock = """
            start          | {"startTime":"08:45"} | That timing conflicts with Market. Choose another clock or length.
            planned-length | {"plannedMinutes":90} | That timing conflicts with the fixed start of Gallery. Choose another clock or length.
            """)
    void conflictWithPreviousVisitOrFixedStart_leavesCheckedItineraryUnchanged(String field, String request, String message)
            throws Exception {
        seedTrip(DAY, DAY);
        entry(1, "Market", DAY, 1, "08:30", 30, false, "30m");
        var museum = entry(2, "Museum", DAY, 2, "09:00", 30, false, "30m-2h");
        entry(3, "Garden", DAY, 3, "10:00", 30, false, "30m");
        entry(4, "Gallery", DAY, 4, "10:45", 15, true, "15m");
        checkItinerary();

        rejected(putTiming(museum, field, request), message);
        saved().andExpect(jsonPath("$.days[0].entries[*].timing.start", contains(
                        DAY + "T08:30+02:00", DAY + "T09:00+02:00", DAY + "T10:00+02:00", DAY + "T10:45+02:00")))
                .andExpect(jsonPath("$.days[0].entries[1].timing.end").value(DAY + "T09:30+02:00"))
                .andExpect(jsonPath("$.checkState").value("MANUALLY_CHECKED"))
                .andExpect(jsonPath("$.changeNotices").isEmpty());
    }

    @Test
    void endThatPushesNextVisitOntoAnotherDay_isRejected() throws Exception {
        seedTrip(DAY, TOMORROW);
        var museum = entry(1, "Museum", DAY, 1, "22:30", 30, false, "30m-2h");
        entry(2, "Lookout", DAY, 2, "23:30", 0, false, "0m");

        rejected(putEnd(museum, TOMORROW, "00:00"),
                "That change would push Lookout past its start date (2027-03-29). Choose another clock or length.");
        saved().andExpect(jsonPath("$.days[0].entries[0].timing.end").value(DAY + "T23:00+02:00"))
                .andExpect(jsonPath("$.days[0].entries[1].timing.start").value(DAY + "T23:30+02:00"))
                .andExpect(jsonPath("$.days[1].entries").isEmpty());
    }

    @ParameterizedTest
    @CsvSource(delimiter = '|', textBlock = """
            2027-03-29 | Enter an end at or after the start that gives a length in whole minutes. Include the end date if it differs.
            2027-03-30 | That timing conflicts with Garden. Choose another clock or length.
            """)
    void endBeforeStartOrInsideNextVisit_isRejectedWithoutMovingVisits(String endDate, String message) throws Exception {
        seedTrip(DAY, TOMORROW);
        var museum = entry(1, "Museum", DAY, 1, "23:00", 30, false, "30m-2h");
        entry(2, "Garden", TOMORROW, 1, "00:30", 30, false, "30m");

        rejected(putEnd(museum, endDate, "01:00"), message);
        saved().andExpect(jsonPath("$.days[0].entries[0].timing.end").value(DAY + "T23:30+02:00"))
                .andExpect(jsonPath("$.days[1].entries[0].timing.start").value(TOMORROW + "T00:30+02:00"));
    }

    @Test
    void overnightEndAtNextVisitStart_keepsEntryOnOriginalDay() throws Exception {
        seedTrip(DAY, TOMORROW);
        var museum = entry(1, "Museum", DAY, 1, "23:00", 30, false, "30m-2h");
        var garden = entry(2, "Garden", TOMORROW, 1, "00:30", 30, false, "30m");
        putStart(garden, "01:00").andExpect(status().isNoContent());

        putEnd(museum, TOMORROW, "01:00").andExpect(status().isNoContent());
        saved().andExpect(jsonPath("$.days[0].entries.length()").value(1))
                .andExpect(jsonPath("$.days[0].entries[0].timing.start").value(DAY + "T23:00+02:00"))
                .andExpect(jsonPath("$.days[0].entries[0].timing.end").value(TOMORROW + "T01:00+02:00"))
                .andExpect(jsonPath("$.days[1].entries.length()").value(1))
                .andExpect(jsonPath("$.days[1].entries[0].timing.start").value(TOMORROW + "T01:00+02:00"));
    }

    @Test
    void endAtMidnightAfterLastTripDay_isAccepted() throws Exception {
        seedTrip(DAY, DAY);
        var museum = entry(1, "Museum", DAY, 1, "23:00", 30, false, "30m-2h");

        putPlannedLength(museum, 60).andExpect(status().isNoContent());
        saved().andExpect(jsonPath("$.days[0].entries[0].timing.end").value(TOMORROW + "T00:00+02:00"));
    }

    @Test
    void endOneMinutePastTripBoundary_isRejected() throws Exception {
        seedTrip(DAY, DAY);
        var museum = entry(1, "Museum", DAY, 1, "23:00", 60, false, "30m-2h");

        rejected(putPlannedLength(museum, 61), "Museum would end after the trip, which ends on 2027-03-29.");
        saved().andExpect(jsonPath("$.days[0].entries[0].timing.end").value(TOMORROW + "T00:00+02:00"));
    }

    @Test
    void briefStopStartingAtTripBoundary_isRejected() throws Exception {
        seedTrip(DAY, DAY);
        entry(1, "Museum", DAY, 1, "23:00", 60, false, "30m-2h");
        entityManager.createNativeQuery("UPDATE trip_attraction SET visit_time = '0m' WHERE attraction_id = 2")
                .executeUpdate();

        rejected(mockMvc.perform(post(ITINERARY + "/attractions").header("x-api-version", "1")
                        .contentType(MediaType.APPLICATION_JSON).content("""
                                {"attractionId":2,"date":"2027-03-30","startTime":"00:00"}
                                """)),
                "There is no itinerary day for 2027-03-30. Choose another day.");
        saved().andExpect(jsonPath("$.days[0].entries.length()").value(1))
                .andExpect(jsonPath("$.days[0].entries[0].timing.end").value(TOMORROW + "T00:00+02:00"));
    }

    @Test
    void briefStopInsidePreviousVisit_isRejected() throws Exception {
        seedTrip(DAY, DAY);
        entry(1, "Museum", DAY, 1, "09:00", 60, false, "50-90m");
        var first = entry(2, "First lookout", DAY, 2, "10:00", 0, false, "0m");

        rejected(putStart(first, "09:59"), "That timing conflicts with Museum. Choose another clock or length.");
    }

    @Test
    void briefStopsPushedToSameTime_keepManualOrder() throws Exception {
        seedTrip(DAY, DAY);
        var museum = entry(1, "Museum", DAY, 1, "09:00", 60, false, "50-90m");
        entry(2, "First lookout", DAY, 2, "10:00", 0, false, "0m");
        entry(3, "Second lookout", DAY, 3, "10:00", 0, false, "0m");
        entry(4, "Garden", DAY, 4, "10:00", 45, false, "45m");

        putEnd(museum, DAY, "10:10").andExpect(status().isNoContent());
        saved().andExpect(jsonPath("$.days[0].entries[*].name",
                        contains("Museum", "First lookout", "Second lookout", "Garden")))
                .andExpect(jsonPath("$.days[0].entries[*].timing.start", contains(
                        DAY + "T09:00+02:00", DAY + "T10:10+02:00", DAY + "T10:10+02:00", DAY + "T10:10+02:00")))
                .andExpect(jsonPath("$.days[0].entries[*].timing.end", contains(
                        DAY + "T10:10+02:00", DAY + "T10:10+02:00", DAY + "T10:10+02:00", DAY + "T10:55+02:00")));
    }

    @ParameterizedTest
    @CsvSource(delimiter = '|', textBlock = """
            start | {"startTime":"02:30"}
            end   | {"endDate":"2027-03-28","endTime":"02:30"}
            """)
    void enteredTimeInSpringClockGap_isRejected(String field, String request) throws Exception {
        var date = "2027-03-28";
        seedTrip(date, date);
        var museum = entry(1, "Museum", date, 1, "01:30", 30, false, "15-60m");

        rejected(putTiming(museum, field, request),
                "That " + field + " clock does not occur in Europe/Belgrade on this date. Choose another time.");
    }

    @Test
    void visitCrossingSpringClockChange_keepsElapsedLength() throws Exception {
        var date = "2027-03-28";
        seedTrip(date, date);
        var museum = entry(1, "Museum", date, 1, "01:30", 30, false, "15-60m");

        putStart(museum, "01:45").andExpect(status().isNoContent());
        saved().andExpect(jsonPath("$.days[0].entries[0].timing.start").value(date + "T01:45+01:00"))
                .andExpect(jsonPath("$.days[0].entries[0].timing.end").value(date + "T03:15+02:00"));
    }

    @ParameterizedTest
    @CsvSource(delimiter = '|', textBlock = """
            start | 03:00 | {"startTime":"02:30"}                      | 02:30
            end   | 01:50 | {"endDate":"2027-10-31","endTime":"02:25"} | 02:25
            """)
    void enteredTimeInRepeatedHour_usesFirstOccurrence(String field, String originalStart, String request, String expectedClock)
            throws Exception {
        var date = "2027-10-31";
        seedTrip(date, date);
        var museum = entry(1, "Museum", date, 1, originalStart, 10, false, "10m-2h");

        putTiming(museum, field, request).andExpect(status().isNoContent());
        saved().andExpect(jsonPath("$.days[0].entries[0].timing." + field).value(date + "T" + expectedClock + "+02:00"));
    }

    @Test
    void pushingVisitToSecondClockOccurrence_recordsStartChange() throws Exception {
        var date = "2027-10-31";
        seedTrip(date, date);
        var museum = entry(1, "Museum", date, 1, "01:50", 10, false, "10m-2h");
        var garden = entry(2, "Garden", date, 2, "03:00", 10, false, "10m");
        putStart(garden, "02:30").andExpect(status().isNoContent());
        putEnd(museum, date, "02:25").andExpect(status().isNoContent());
        checkItinerary();

        putPlannedLength(museum, 100).andExpect(status().isNoContent());
        saved().andExpect(jsonPath("$.days[0].entries[0].timing.end").value(date + "T02:30+01:00"))
                .andExpect(jsonPath("$.days[0].entries[1].timing.start").value(date + "T02:30+01:00"))
                .andExpect(jsonPath("$.days[0].entries[1].timing.end").value(date + "T02:40+01:00"))
                .andExpect(jsonPath("$.changeNotices[0].reasons", contains("PLANNED_LENGTH_CHANGED")))
                .andExpect(jsonPath("$.changeNotices[1].reasons", contains("START_CHANGED")));
    }

    @Test
    void unchangedStart_keepsItineraryManuallyChecked() throws Exception {
        var museum = checkedMuseumAt("10:00", 30);

        putStart(museum, "10:00").andExpect(status().isNoContent());
        saved().andExpect(jsonPath("$.checkState").value("MANUALLY_CHECKED"))
                .andExpect(jsonPath("$.changeNotices").isEmpty());
    }

    @Test
    void movingCheckedStart_recordsStartChangeNotice() throws Exception {
        var museum = checkedMuseumAt("10:00", 30);

        putStart(museum, "11:00").andExpect(status().isNoContent());
        saved().andExpect(jsonPath("$.days[0].entries[0].timing.start").value(DAY + "T11:00+02:00"))
                .andExpect(jsonPath("$.checkState").value("CHANGED_SINCE_LAST_CHECK"))
                .andExpect(jsonPath("$.changeNotices[0].reasons", contains("START_CHANGED")));
    }

    @Test
    void restoringOriginalStart_keepsStartChangeNotice() throws Exception {
        var museum = checkedMuseumAt("10:00", 30);
        putStart(museum, "11:00").andExpect(status().isNoContent());

        putStart(museum, "10:00").andExpect(status().isNoContent());
        saved().andExpect(jsonPath("$.days[0].entries[0].timing.start").value(DAY + "T10:00+02:00"))
                .andExpect(jsonPath("$.checkState").value("CHANGED_SINCE_LAST_CHECK"))
                .andExpect(jsonPath("$.changeNotices[0].reasons", contains("START_CHANGED")));
    }

    @Test
    void restoringStartAndLength_keepsBothReasonsOnOneNotice() throws Exception {
        var museum = checkedMuseumAt("10:00", 30);
        putStart(museum, "11:00").andExpect(status().isNoContent());
        putStart(museum, "10:00").andExpect(status().isNoContent());

        putPlannedLength(museum, 60).andExpect(status().isNoContent());
        putPlannedLength(museum, 30).andExpect(status().isNoContent());
        saved().andExpect(jsonPath("$.days[0].entries[0].timing.end").value(DAY + "T10:30+02:00"))
                .andExpect(jsonPath("$.changeNotices.length()").value(1))
                .andExpect(jsonPath("$.changeNotices[0].reasons", contains("START_CHANGED", "PLANNED_LENGTH_CHANGED")));
    }

    @Test
    void manualRecheck_clearsTimingChangeNotice() throws Exception {
        var museum = checkedMuseumAt("10:00", 30);
        putStart(museum, "11:00").andExpect(status().isNoContent());
        putPlannedLength(museum, 60).andExpect(status().isNoContent());

        checkItinerary();
        saved().andExpect(jsonPath("$.checkState").value("MANUALLY_CHECKED"))
                .andExpect(jsonPath("$.changeNotices").isEmpty());
    }

    private long checkedMuseumAt(String start, int minutes) throws Exception {
        seedTrip(DAY, DAY);
        var museum = entry(1, "Museum", DAY, 1, start, minutes, false, "30-90m");
        checkItinerary();
        return museum;
    }

    @ParameterizedTest
    @CsvSource(delimiter = '|', textBlock = """
            start          | {"startTime":"09:30"}                     | START_CHANGED
            end            | {"endDate":"2027-03-29","endTime":"10:00"} | PLANNED_LENGTH_CHANGED
            planned-length | {"plannedMinutes":60}                     | PLANNED_LENGTH_CHANGED
            """)
    void repeatingSameTimingEdit_leavesPushedVisitAndNoticesUnchanged(String field, String request, String reason)
            throws Exception {
        seedTrip(DAY, DAY);
        var museum = entry(1, "Museum", DAY, 1, "09:00", 30, false, "30-60m");
        checkItinerary();
        entry(2, "Garden", DAY, 2, "09:45", 30, false, "30m");

        putTiming(museum, field, request).andExpect(status().isNoContent())
                .andExpect(header().string(HttpHeaders.LOCATION, "http://localhost" + ITINERARY))
                .andExpect(content().string(""));
        var afterFirstPut = saved()
                .andExpect(jsonPath("$.days[0].entries[1].timing.start").value(DAY + "T10:00+02:00"))
                .andExpect(jsonPath("$.checkState").value("CHANGED_SINCE_LAST_CHECK"))
                .andExpect(jsonPath("$.changeNotices[*].subject", contains("Museum", "Garden")))
                .andExpect(jsonPath("$.changeNotices[0].reasons", contains(reason)))
                .andExpect(jsonPath("$.changeNotices[1].reasons", contains("ATTRACTION_ADDED", "START_CHANGED")))
                .andReturn().getResponse().getContentAsString();

        putTiming(museum, field, request).andExpect(status().isNoContent());
        saved().andExpect(content().json(afterFirstPut, JsonCompareMode.STRICT));
    }

    @ParameterizedTest
    @CsvSource(delimiter = '|', textBlock = """
            start          | {}                                        | {startTime = must not be null}
            start          | {"startTime":"24:00"}                     | {startTime = enter a local clock as HH:mm or HH:mm:ss}
            start          | {"startTime":"09:30","plannedMinutes":30} | Request body must contain valid JSON with the expected field types.
            end            | {"endTime":"09:30"}                       | {endDate = must not be null}
            end            | {"endDate":"2027-03-29"}                  | {endTime = must not be null}
            planned-length | {}                                        | {plannedMinutes = must not be null}
            planned-length | {"plannedMinutes":30.5}                   | {wholePlannedLength = enter a non-negative whole length in minutes}
            planned-length | {"plannedMinutes":-1}                     | {wholePlannedLength = enter a non-negative whole length in minutes}
            planned-length | {"plannedMinutes":2147483648}             | {wholePlannedLength = enter a non-negative whole length in minutes}
            """)
    void malformedTimingRequest_isRejectedWithoutChangingSavedInterval(String field, String request, String message)
            throws Exception {
        seedTrip(DAY, DAY);
        var museum = entry(1, "Museum", DAY, 1, "09:00", 30, false, "30-60m");

        rejected(putTiming(museum, field, request), message);
        saved().andExpect(jsonPath("$.days[0].entries[0].timing.start").value(DAY + "T09:00+02:00"))
                .andExpect(jsonPath("$.days[0].entries[0].timing.end").value(DAY + "T09:30+02:00"));
    }

    private ResultActions putStart(long entryId, String clock) throws Exception {
        return putTiming(entryId, "start", """
                {"startTime":"%s"}
                """.formatted(clock));
    }

    private ResultActions putEnd(long entryId, String date, String clock) throws Exception {
        return putTiming(entryId, "end", """
                {"endDate":"%s","endTime":"%s"}
                """.formatted(date, clock));
    }

    private ResultActions putPlannedLength(long entryId, int minutes) throws Exception {
        return putTiming(entryId, "planned-length", """
                {"plannedMinutes":%d}
                """.formatted(minutes));
    }

    private ResultActions putTiming(long entryId, String field, String request) throws Exception {
        return mockMvc.perform(put(ITINERARY + "/entries/{entryId}/{field}", entryId, field)
                .header("x-api-version", "1").contentType(MediaType.APPLICATION_JSON).content(request));
    }

    private static void rejected(ResultActions result, String message) throws Exception {
        result.andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errorCode").value("BAD_REQUEST"))
                .andExpect(jsonPath("$.errorMessage").value(message));
    }

    private ResultActions saved() throws Exception {
        entityManager.flush();
        entityManager.clear();
        return mockMvc.perform(get(ITINERARY).header("x-api-version", "1")).andExpect(status().isOk());
    }

    private void checkItinerary() throws Exception {
        entityManager.flush();
        entityManager.clear();
        mockMvc.perform(post(ITINERARY + "/check").header("x-api-version", "1")).andExpect(status().isNoContent());
    }

    private void seedTrip(String first, String last) {
        KeysetTestFixtures.clear(entityManager);
        KeysetTestFixtures.populateTripBoardWithDistinctRelationships(entityManager, 5);
        entityManager.createNativeQuery("""
                UPDATE trip SET trip_start_date = CAST(:first AS date), trip_end_date = CAST(:last AS date) WHERE id = 1;
                INSERT INTO itinerary(trip_id, time_zone) VALUES (1, 'Europe/Belgrade');
                INSERT INTO itinerary_day(trip_id, date)
                SELECT 1, CAST(:first AS date) + day_offset
                FROM generate_series(0, CAST(:last AS date) - CAST(:first AS date)) AS days(day_offset);
                """).setParameter("first", first).setParameter("last", last).executeUpdate();
    }

    private long entry(int attraction, String name, String date, int position, String start,
                       int length, boolean fixed, String sourceDuration) {
        entityManager.createNativeQuery("""
                UPDATE attraction SET name = :name WHERE id = :attraction;
                UPDATE trip_attraction SET visit_time = :source WHERE trip_id = 1 AND attraction_id = :attraction;
                """).setParameter("name", name).setParameter("source", sourceDuration)
                .setParameter("attraction", attraction).executeUpdate();
        return ((Number) entityManager.createNativeQuery("""
                INSERT INTO itinerary_entry(trip_id, date, attraction_id, path_position, zone_id,
                    start_time, planned_minutes, fixed_start)
                VALUES (1, CAST(:date AS date), :attraction, :position, 'Europe/Belgrade', CAST(:start AS time), :length,
                    :fixed) RETURNING id
                """).setParameter("date", date).setParameter("attraction", attraction).setParameter("position", position)
                .setParameter("start", start).setParameter("length", length).setParameter("fixed", fixed)
                .getSingleResult()).longValue();
    }
}
