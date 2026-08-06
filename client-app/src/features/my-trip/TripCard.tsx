import { Button } from "@fluentui/react-components";
import { mergeClasses } from "@fluentui/react-components";
import { Text } from "@fluentui/react-components";
import {
  Delete24Regular,
  Edit24Regular,
  TicketDiagonal24Regular
} from "@fluentui/react-icons";
import React from "react";
import { TRIP_STATUS_LABEL } from "./TripCard.config";
import { useTripCardClasses } from "./TripCard.styles";
import { TripCardProps } from "./TripCard.types";
import { Flex } from "../../shared/ui/Flex";

export const TripCard: React.FC<TripCardProps> = ({
  trip,
  onClick,
  onDelete,
  onEdit
}) => {
  const classes = useTripCardClasses();

  const formatDate = (iso?: string): string =>
    iso
      ? new Date(iso).toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric"
        })
      : "?";

  const dateLabel = trip.startDate
    ? trip.endDate
      ? `${formatDate(trip.startDate)} – ${formatDate(trip.endDate)}`
      : `From ${formatDate(trip.startDate)}`
    : "Dates not set";

  const statusClass =
    trip.status === "active"
      ? classes.statusActive
      : trip.status === "past"
        ? classes.statusPast
        : classes.statusArchived;

  return (
    <Flex
      className={classes.card}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onClick()}
      aria-label={`Open trip: ${trip.name}`}
    >
      <Flex className={classes.cardBanner} align="center" justify="center">
        <TicketDiagonal24Regular className={classes.bannerIcon} />
        <Button
          appearance="subtle"
          icon={<Edit24Regular />}
          title="Edit trip"
          aria-label="Edit trip"
          className={mergeClasses(classes.cardAction, classes.editButton)}
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
        />
        <Button
          appearance="subtle"
          icon={<Delete24Regular />}
          title="Delete trip"
          aria-label="Delete trip"
          className={mergeClasses(classes.cardAction, classes.deleteButton)}
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
        />
      </Flex>
      <Flex className={classes.cardBody}>
        <Text className={classes.tripName}>{trip.name}</Text>
        <Text className={classes.dateText}>{dateLabel}</Text>
        <span className={mergeClasses(classes.statusBadge, statusClass)}>
          {TRIP_STATUS_LABEL[trip.status]}
        </span>
      </Flex>
    </Flex>
  );
};

export default TripCard;
