import {
  Button,
  Caption1,
  Caption1Strong,
  Dialog,
  DialogActions,
  DialogBody,
  DialogContent,
  DialogSurface,
  DialogTitle,
  MessageBar,
  MessageBarActions,
  MessageBarBody,
  Spinner,
  Subtitle2
} from "@fluentui/react-components";
import { Fragment, useEffect, useId, useState, type ReactElement } from "react";
import type { Attraction } from "../continent/domain/Attraction.types";
import { getAttractionById } from "../continent/infra/ManagerApi";
import "../AI-table/styles/AttractionItem.css";
import { useClasses } from "./Itinerary.styles";
import type { ItineraryAttraction } from "./ItineraryDrag";
import { elapsedMinutes } from "./itineraryClocks";

const recorded = (value?: string): string =>
  value?.trim() ? value : "Not recorded";

const readable = (value: string): string =>
  value.charAt(0) + value.slice(1).toLowerCase().replaceAll("_", " ");

const dateLabel = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeZone: "UTC"
});

const formatDate = (date: string): string =>
  dateLabel.format(new Date(date.slice(0, 10)));

type Fact = readonly [label: string, value: string];

function catalogueFacts(attraction: Attraction): Fact[] {
  const { address, destination, optimalVisitPeriod, permanentlyClosedAt } =
    attraction;
  const { countryName, regionName, cityName, isCountrywide } = destination;
  return [
    ["Name", attraction.name.name],
    ["Address", recorded(address.streetAddress)],
    [
      "Location",
      address.location
        ? `${address.location.latitude}, ${address.location.longitude}`
        : "Not recorded"
    ],
    [
      "Geography",
      isCountrywide
        ? `${countryName} (countrywide)`
        : Array.from(new Set([cityName, regionName, countryName]))
            .filter(Boolean)
            .join(", ")
    ],
    ["Category", readable(attraction.category)],
    ["Type", readable(attraction.type)],
    ["Main attraction", attraction.name.mainAttractionName ?? "None"],
    ["Traditional", attraction.isTraditional ? "Yes" : "No"],
    ["Catalogue tip", recorded(attraction.tip)],
    ["Information source", attraction.infoFrom.source],
    [
      "Optimal visit period",
      optimalVisitPeriod
        ? `${formatDate(optimalVisitPeriod.fromDate)} to ${formatDate(optimalVisitPeriod.toDate)}`
        : "Not recorded"
    ],
    [
      "Permanent closure",
      permanentlyClosedAt
        ? `Permanently closed since ${formatDate(permanentlyClosedAt)}`
        : "Not permanently closed"
    ]
  ];
}

function FactsSection({
  title,
  facts
}: {
  title: string;
  facts: Fact[];
}): ReactElement {
  const classes = useClasses();
  const headingId = useId();
  return (
    <section aria-labelledby={headingId}>
      <Subtitle2 as="h3" id={headingId}>
        {title}
      </Subtitle2>
      <dl className={classes.factsList}>
        {facts.map(([label, value]) => (
          <Fragment key={label}>
            <dt>
              <Caption1Strong>{label}</Caption1Strong>
            </dt>
            <dd>{value}</dd>
          </Fragment>
        ))}
      </dl>
    </section>
  );
}

export function TripAttractionCardFacts({
  attraction: { workingHours, visitDuration, tripNote },
  showMissing = false
}: {
  attraction: ItineraryAttraction;
  showMissing?: boolean;
}): ReactElement {
  return (
    <>
      {(showMissing || workingHours?.trim()) && (
        <Caption1>
          {workingHours?.trim()
            ? `Working hours: ${workingHours}`
            : "Working hours not recorded"}
        </Caption1>
      )}
      {(showMissing || visitDuration?.trim()) && (
        <Caption1>
          {visitDuration?.trim()
            ? `Visit duration: ${visitDuration}`
            : "Visit duration not recorded"}
        </Caption1>
      )}
      {tripNote?.trim() && (
        <div role="note" aria-label="Trip note" className="sticky-note">
          <Caption1Strong block>Trip note</Caption1Strong>
          <Caption1 block>{tripNote}</Caption1>
        </div>
      )}
    </>
  );
}

type CatalogueRead =
  | { status: "loading" }
  | { status: "failed" }
  | { status: "loaded"; value: Attraction };

export function AttractionFactsDialog({
  attraction,
  importance,
  onClose,
  onEditTripData
}: {
  attraction: ItineraryAttraction;
  importance: string;
  onClose: () => void;
  onEditTripData: () => void;
}): ReactElement {
  const classes = useClasses();
  const { attractionId, workingHours, visitDuration, mustVisit, tripNote } =
    attraction;
  const [catalogue, setCatalogue] = useState<CatalogueRead>({
    status: "loading"
  });
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const request = new AbortController();
    void getAttractionById(attractionId, request.signal).then(
      (value) => {
        if (!request.signal.aborted) setCatalogue({ status: "loaded", value });
      },
      () => {
        if (!request.signal.aborted) setCatalogue({ status: "failed" });
      }
    );
    return () => request.abort();
  }, [attractionId, attempt]);
  return (
    <Dialog
      open
      onOpenChange={(_event, data) => {
        if (!data.open) onClose();
      }}
    >
      <DialogSurface>
        <DialogBody>
          <DialogTitle>
            {catalogue.status === "loaded"
              ? catalogue.value.name.name
              : attraction.name}
          </DialogTitle>
          <DialogContent className={classes.factsSections}>
            <FactsSection
              title="Trip data"
              facts={[
                ["Working hours", recorded(workingHours)],
                ["Visit duration", recorded(visitDuration)],
                ["Must-visit", mustVisit ? "Yes" : "No"],
                ["Importance", importance],
                ["Trip note", recorded(tripNote)]
              ]}
            />
            {"timing" in attraction && (
              <FactsSection
                title="Entry data"
                facts={[
                  [
                    "Planned length",
                    `${elapsedMinutes(attraction.timing.start, attraction.timing.end)} min`
                  ]
                ]}
              />
            )}
            {catalogue.status === "loading" && (
              <Spinner size="tiny" label="Loading catalogue facts" />
            )}
            {catalogue.status === "failed" && (
              <MessageBar intent="error">
                <MessageBarBody>
                  The catalogue facts couldn&apos;t be loaded.
                </MessageBarBody>
                <MessageBarActions>
                  <Button
                    size="small"
                    onClick={() => {
                      setCatalogue({ status: "loading" });
                      setAttempt((count) => count + 1);
                    }}
                  >
                    Retry
                  </Button>
                </MessageBarActions>
              </MessageBar>
            )}
            {catalogue.status === "loaded" && (
              <FactsSection
                title="Catalogue facts"
                facts={catalogueFacts(catalogue.value)}
              />
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={onClose}>Close</Button>
            <Button appearance="primary" onClick={onEditTripData}>
              Edit trip data on board
            </Button>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
}
