import React from "react";
import "../styles/VisitHistoryBadge.css";
import type { VisitHistoryEntry } from "../../my-trip/domain/VisitHistory.types";
import { RATING_OPTION_BY_VALUE } from "./Ratings";

interface VisitHistoryBadgeProps {
  visits: VisitHistoryEntry[];
}

function formatVisitLine(visit: VisitHistoryEntry): string {
  const ratingInfo = RATING_OPTION_BY_VALUE[visit.rating];
  const parts: string[] = [
    `${visit.tripName} (${visit.tripToDate ?? "?"})`,
    `${ratingInfo.emoji} ${ratingInfo.label}`
  ];
  if (visit.wouldVisitAgain !== undefined) {
    parts.push(
      visit.wouldVisitAgain
        ? "🔁 would visit again"
        : "🚫 would not visit again"
    );
  }
  if (visit.reviewNote) {
    parts.push(`“${visit.reviewNote}”`);
  }
  return parts.join(" · ");
}

const VisitHistoryBadge: React.FC<VisitHistoryBadgeProps> = ({ visits }) => {
  const sortedVisits = [...visits].sort((a, b) =>
    (b.tripToDate || "").localeCompare(a.tripToDate || "")
  );

  if (sortedVisits.length === 0) return null;

  const latest = sortedVisits[0];
  const moreCount = sortedVisits.length - 1;
  const ratingInfo = RATING_OPTION_BY_VALUE[latest.rating];
  const isPoor = ratingInfo.score < RATING_OPTION_BY_VALUE.VERY_GOOD.score;
  const badgeClass = `visit-history-badge ${isPoor ? "poor" : "good"}`;
  const tooltip = sortedVisits.map(formatVisitLine).join("\n");
  const ariaLabel = `Visited in "${latest.tripName}" — ${ratingInfo.emoji} ${ratingInfo.label}${moreCount > 0 ? ` (+${moreCount} more)` : ""}`;

  return (
    <div className="attraction-visit-history" title={tooltip}>
      <span className={badgeClass} aria-label={ariaLabel}>
        <span className="visit-check">✓</span>
        <span className="visit-trip-name">“{latest.tripName}”</span>
        <span className="visit-sep">·</span>
        <span className="visit-rating">
          {ratingInfo.emoji} {ratingInfo.label}
        </span>
        {latest.wouldVisitAgain !== undefined && (
          <span
            className={`visit-again-inline ${latest.wouldVisitAgain ? "yes" : "no"}`}
            aria-label={
              latest.wouldVisitAgain
                ? "Would visit again"
                : "Would not visit again"
            }
          >
            {latest.wouldVisitAgain ? "🔁" : "🚫"}
          </span>
        )}
      </span>
      {moreCount > 0 && (
        <span
          className="visit-history-more"
          aria-label={`${moreCount} more review${moreCount > 1 ? "s" : ""}`}
        >
          +{moreCount}
        </span>
      )}
    </div>
  );
};

export default VisitHistoryBadge;
