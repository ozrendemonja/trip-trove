import { Icon, IconButton, Stack, Text } from "@fluentui/react";
import React from "react";
import { TRIP_STATUS_LABEL } from "./TripCard.config";
import { useTripCardClasses } from "./TripCard.styles";
import { TripCardProps } from "./TripCard.types";

export const TripCard: React.FC<TripCardProps> = ({
  trip,
  onClick,
  onDelete,
  onEdit
}) => {
  const { deleteBtn, editBtn, ...classes } = useTripCardClasses(trip.status);

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

  return (
    <Stack
      className={classes.card}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onClick()}
      aria-label={`Open trip: ${trip.name}`}
    >
      <Stack
        className={classes.cardBanner}
        verticalAlign="center"
        horizontalAlign="center"
      >
        <Icon iconName="AirTickets" className={classes.bannerIcon} />
        <IconButton
          iconProps={{ iconName: "Edit" }}
          title="Edit trip"
          ariaLabel="Edit trip"
          styles={editBtn}
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
        />
        <IconButton
          iconProps={{ iconName: "Delete" }}
          title="Delete trip"
          ariaLabel="Delete trip"
          styles={deleteBtn}
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
        />
      </Stack>
      <Stack className={classes.cardBody}>
        <Text className={classes.tripName}>{trip.name}</Text>
        <Text className={classes.dateText}>{dateLabel}</Text>
        <span className={classes.statusBadge}>
          {TRIP_STATUS_LABEL[trip.status]}
        </span>
      </Stack>
    </Stack>
  );
};

export default TripCard;
