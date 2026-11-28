const dateLabel = new Intl.DateTimeFormat("en-US", {
  weekday: "long",
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC"
});

export const formatItineraryDate = (date: string): string =>
  dateLabel.format(new Date(date));
