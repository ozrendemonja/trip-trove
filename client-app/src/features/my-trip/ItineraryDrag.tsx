import { ReOrderDotsVertical20Regular } from "@fluentui/react-icons";
import type { DragEvent, ReactElement } from "react";
import type {
  GetItineraryResponse,
  ScheduleAttractionRequest
} from "../../clients/manager";
import { useClasses } from "./Itinerary.styles";
import { clockOffset, localClock } from "./itineraryClocks";

type Day = GetItineraryResponse["days"][number];
type Attraction = GetItineraryResponse["unscheduledAttractions"][number];
type Entry = Day["entries"][number];

export type DraggedItineraryItem =
  { kind: "pool"; attraction: Attraction } | { kind: "entry"; entry: Entry };

export function ItineraryDragHandle({
  item,
  blocked,
  onGrab,
  onRelease
}: {
  item: DraggedItineraryItem;
  blocked: boolean;
  onGrab: (item: DraggedItineraryItem) => void;
  onRelease: () => void;
}): ReactElement {
  const classes = useClasses();
  const subject = item.kind === "pool" ? item.attraction : item.entry;
  const start = (event: DragEvent<HTMLSpanElement>): void => {
    if (blocked) {
      event.preventDefault();
      return;
    }
    const { dataTransfer, currentTarget } = event;
    const category = subject.category.toLowerCase().replaceAll("_", " ");
    const preview = currentTarget.ownerDocument.createElement("div");
    preview.className = classes.dragPreview;
    preview.textContent = `${subject.name} · ${category}`;
    currentTarget.ownerDocument.body.append(preview);
    dataTransfer.effectAllowed = item.kind === "pool" ? "copy" : "move";
    dataTransfer.setData("application/x-trip-trove-itinerary", subject.name);
    dataTransfer.setDragImage(preview, 12, 12);
    // Keep the element alive for the browser's drag snapshot, not as an overlay.
    requestAnimationFrame(() => preview.remove());
    onGrab(item);
  };
  return (
    <span
      aria-hidden="true"
      title={`Drag ${subject.name}`}
      className={classes.dragHandle}
      draggable={!blocked}
      onDragStart={start}
      onDragEnd={onRelease}
    >
      <ReOrderDotsVertical20Regular />
    </span>
  );
}

export function dropSlot(event: DragEvent<HTMLElement>, day: Day): number {
  const target = event.target;
  if (target instanceof Element) {
    const slot = target.closest<HTMLElement>("[data-itinerary-slot]");
    if (slot) return Number(slot.dataset.itinerarySlot);

    const entry = target.closest<HTMLElement>("[data-itinerary-entry-index]");
    if (entry) {
      const { top, height } = entry.getBoundingClientRect();
      const index = Number(entry.dataset.itineraryEntryIndex);
      return event.clientY < top + height / 2 ? index : index + 1;
    }
  }
  return day.entries.length;
}

export function gapSuggestion(
  days: readonly Day[],
  day: Day,
  slot: number
): Pick<ScheduleAttractionRequest, "startTime" | "startOffset"> {
  const previous =
    day.entries[slot - 1] ??
    days
      .findLast(
        (candidate) => candidate.date < day.date && candidate.entries.length
      )
      ?.entries.at(-1);
  if (!previous?.timing.end.startsWith(`${day.date}T`)) return {};
  const { end, repeatedEnd } = previous.timing;
  return {
    startTime: localClock(end),
    startOffset: repeatedEnd ? clockOffset(end) : undefined
  };
}
