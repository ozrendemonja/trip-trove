import { Button } from "@fluentui/react-components";
import { ReOrderDotsVertical20Regular } from "@fluentui/react-icons";
import {
  useRef,
  type DragEvent,
  type HTMLAttributes,
  type ReactElement
} from "react";
import type {
  AttractionEntry,
  GetItineraryResponse,
  ScheduleAttractionRequest,
  TypedItineraryEntryResponse
} from "../../clients/manager";
import { useClasses } from "./Itinerary.styles";
import { clockOffset, localClock } from "./itineraryClocks";
import { isAttractionEntry, type ItineraryEntry } from "./itineraryEntries";

type Day = GetItineraryResponse["days"][number];
type Attraction = GetItineraryResponse["unscheduledAttractions"][number];
export type GroupedAttraction = NonNullable<
  AttractionEntry["groupedAttractions"]
>[number];

export type GroupMemberItem = {
  kind: "member";
  host: AttractionEntry;
  member: GroupedAttraction;
};

export type DraggedItineraryItem =
  | { kind: "pool"; attraction: Attraction }
  | { kind: "entry"; entry: ItineraryEntry }
  | GroupMemberItem;

export type ItineraryAttraction =
  Attraction | AttractionEntry | GroupedAttraction;
export type OpenAttractionFacts = (
  attractionId: number,
  trigger: HTMLButtonElement
) => void;

export type OpenTypedItem = (
  item: TypedItineraryEntryResponse,
  trigger: HTMLButtonElement
) => void;

export const attractionNameId = (attractionId: number): string =>
  `itinerary-attraction-${attractionId}`;

const controlSelector =
  "button, a[href], input, select, textarea, label, [contenteditable], [role='menuitem']";

export function useItineraryCard({
  item,
  blocked,
  onGrab,
  onRelease,
  onOpenFacts,
  onOpenItem,
  description
}: {
  item: DraggedItineraryItem;
  blocked: boolean;
  onGrab: (item: DraggedItineraryItem) => void;
  onRelease: () => void;
  onOpenFacts: OpenAttractionFacts;
  onOpenItem?: OpenTypedItem;
  description?: string;
}): {
  interaction: Pick<
    HTMLAttributes<HTMLElement>,
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
  const subject =
    item.kind === "pool"
      ? item.attraction
      : item.kind === "entry"
        ? item.entry
        : item.member;
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
        if ("attractionId" in subject) {
          onOpenFacts(subject.attractionId, trigger.current);
        } else if (!blocked) {
          onOpenItem?.(subject, trigger.current);
        }
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
        const category = (
          "attractionId" in subject ? subject.category : subject.kind
        )
          .toLowerCase()
          .replaceAll("_", " ");
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
        id={
          "attractionId" in subject
            ? attractionNameId(subject.attractionId)
            : undefined
        }
        ref={trigger}
        type="button"
        size="small"
        appearance="transparent"
        aria-haspopup="dialog"
        aria-description={description}
        disabledFocusable={!("attractionId" in subject) && blocked}
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

export function groupedDropTarget(
  event: DragEvent<HTMLElement>,
  day: Day
): { host: AttractionEntry; memberIndex?: number } | undefined {
  if (!(event.target instanceof Element)) return;
  const hostTarget = event.target.closest<HTMLElement>(
    "[data-itinerary-group-host]"
  );
  const host = day.entries.find(
    (entry) => entry.entryId === Number(hostTarget?.dataset.itineraryGroupHost)
  );
  if (!host || !isAttractionEntry(host)) return;
  const memberTarget = event.target.closest<HTMLElement>(
    "[data-itinerary-group-member-index]"
  );
  return {
    host,
    memberIndex: memberTarget
      ? Number(memberTarget.dataset.itineraryGroupMemberIndex)
      : undefined
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
