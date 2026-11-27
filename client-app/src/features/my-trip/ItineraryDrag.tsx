import { Button, type CardProps } from "@fluentui/react-components";
import { ReOrderDotsVertical20Regular } from "@fluentui/react-icons";
import { useRef, type DragEvent, type ReactElement } from "react";
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

export type ItineraryAttraction =
  Attraction | Entry | NonNullable<Entry["groupedAttractions"]>[number];
export type OpenAttractionFacts = (
  attractionId: number,
  trigger: HTMLButtonElement
) => void;

export const attractionNameId = (attractionId: number): string =>
  `itinerary-attraction-${attractionId}`;

const controlSelector =
  "button, a[href], input, select, textarea, label, [contenteditable], [role='menuitem']";

export function useItineraryAttractionCard({
  item,
  blocked,
  onGrab,
  onRelease,
  onOpenFacts
}: {
  item: DraggedItineraryItem;
  blocked: boolean;
  onGrab: (item: DraggedItineraryItem) => void;
  onRelease: () => void;
  onOpenFacts: OpenAttractionFacts;
}): {
  interaction: Pick<
    CardProps,
    | "draggable"
    | "onPointerDown"
    | "onPointerUp"
    | "onClick"
    | "onDragStart"
    | "onDragEnd"
  >;
  nameButton: ReactElement;
  dragHandle: ReactElement;
} {
  const classes = useClasses();
  const subject = item.kind === "pool" ? item.attraction : item.entry;
  const trigger = useRef<HTMLButtonElement>(null);
  const pressedControl = useRef(false);
  const didDrag = useRef(false);
  const isIndependentControl = (target: Element): boolean => {
    const control = target.closest(controlSelector);
    return control !== null && control !== trigger.current;
  };
  return {
    interaction: {
      draggable: !blocked,
      onPointerDown: ({ target }) => {
        didDrag.current = false;
        pressedControl.current =
          target instanceof Element && isIndependentControl(target);
      },
      onPointerUp: () => {
        pressedControl.current = false;
      },
      onClick: ({ currentTarget, target, detail, defaultPrevented }) => {
        if (
          defaultPrevented ||
          (detail !== 0 && didDrag.current) ||
          !(target instanceof Element) ||
          !currentTarget.contains(target) ||
          isIndependentControl(target) ||
          !trigger.current
        )
          return;
        onOpenFacts(subject.attractionId, trigger.current);
      },
      onDragStart: (event) => {
        const { dataTransfer, currentTarget, target } = event;
        if (
          blocked ||
          pressedControl.current ||
          !(target instanceof Element) ||
          !currentTarget.contains(target) ||
          isIndependentControl(target)
        ) {
          event.preventDefault();
          return;
        }
        didDrag.current = true;
        const category = subject.category.toLowerCase().replaceAll("_", " ");
        const preview = currentTarget.ownerDocument.createElement("div");
        preview.className = classes.dragPreview;
        preview.textContent = `${subject.name} · ${category}`;
        currentTarget.ownerDocument.body.append(preview);
        dataTransfer.effectAllowed = item.kind === "pool" ? "copy" : "move";
        dataTransfer.setData(
          "application/x-trip-trove-itinerary",
          subject.name
        );
        dataTransfer.setDragImage(preview, 12, 12);
        // Keep the element alive for the browser's drag snapshot, not as an overlay.
        requestAnimationFrame(() => preview.remove());
        onGrab(item);
      },
      onDragEnd: onRelease
    },
    nameButton: (
      <Button
        id={attractionNameId(subject.attractionId)}
        ref={trigger}
        type="button"
        size="small"
        appearance="transparent"
        aria-haspopup="dialog"
        className={classes.attractionName}
      >
        {subject.name}
      </Button>
    ),
    dragHandle: (
      <span
        aria-hidden="true"
        title={`Drag ${subject.name}`}
        className={classes.dragHandle}
      >
        <ReOrderDotsVertical20Regular />
      </span>
    )
  };
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
