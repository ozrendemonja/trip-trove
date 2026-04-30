import React from "react";
import "../styles/VisitHistoryBadge.css";
import type { VisitHistoryEntry } from "../../my-trip/domain/VisitHistory.types";
import { RATING_OPTION_BY_VALUE } from "./Ratings";

interface VisitHistoryBadgeProps {
  visits: VisitHistoryEntry[];
}

const VisitHistoryBadge: React.FC<VisitHistoryBadgeProps> = ({ visits }) => {
  const sortedVisits = [...visits].sort((a, b) =>
    (b.tripToDate || "").localeCompare(a.tripToDate || "")
  );
  const latestVisit = sortedVisits[0];
  const latestRatingInfo = RATING_OPTION_BY_VALUE[latestVisit.rating];
  const isPoor =
    latestRatingInfo.score < RATING_OPTION_BY_VALUE.VERY_GOOD.score;

  const tooltip = sortedVisits
    .map((visit) => {
      const ratingInfo = RATING_OPTION_BY_VALUE[visit.rating];
      const notePart = visit.reviewNote ? ` — ${visit.reviewNote}` : "";
      return `${visit.tripName} (${visit.tripToDate ?? "?"}): ${ratingInfo.emoji} ${ratingInfo.label}${notePart}`;
    })
    .join("\n");

  const labelText = `Visited in "${latestVisit.tripName}" — ${latestRatingInfo.emoji} ${latestRatingInfo.label}`;
  const moreCount = sortedVisits.length - 1;
  const badgeClass = `visit-history-badge ${isPoor ? "poor" : "good"}`;

  return (
    <div className="attraction-visit-history" title={tooltip}>
      <span className={badgeClass} aria-label={labelText}>
        ✓ {labelText}
        {moreCount > 0 ? ` (+${moreCount} more)` : ""}
      </span>
    </div>
  );
};

export default VisitHistoryBadge;
