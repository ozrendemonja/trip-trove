import {
  Button,
  Caption1,
  Caption1Strong,
  Card,
  CardHeader,
  List,
  ListItem,
  Menu,
  MenuItem,
  MenuList,
  MenuPopover,
  MenuTrigger,
  Subtitle2,
  Text
} from "@fluentui/react-components";
import {
  Add16Regular,
  Circle16Regular,
  Food16Regular,
  Star16Filled,
  Star16Regular
} from "@fluentui/react-icons";
import { useId, useRef, type ReactElement } from "react";
import type { GetItineraryResponse } from "../../clients/manager";
import {
  attractionNameId,
  useItineraryCard,
  type DraggedItineraryItem,
  type OpenAttractionFacts
} from "./ItineraryDrag";
import { TripAttractionCardFacts } from "./AttractionFactsDialog";
import { useClasses } from "./Itinerary.styles";

type Attraction = GetItineraryResponse["unscheduledAttractions"][number];

const importance = {
  mustSee: { label: "Must see", Icon: Star16Filled, tone: "star" },
  worthSeeing: { label: "Worth seeing", Icon: Star16Regular, tone: "star" },
  fitNearby: { label: "Fit in nearby", Icon: Circle16Regular, tone: "ring" },
  passingBy: { label: "If passing by", Icon: Circle16Regular, tone: "faint" }
} as const;

const columns = [
  {
    group: "PRIMARY",
    title: "Top Attractions",
    marked: importance.mustSee,
    unmarked: importance.worthSeeing
  },
  {
    group: "SECONDARY",
    title: "Secondary Spots",
    marked: importance.fitNearby,
    unmarked: importance.passingBy
  }
] as const;

type Days = GetItineraryResponse["days"];
type ScheduleAttraction = (
  attraction: Attraction,
  day: Days[number],
  trigger: HTMLButtonElement | null
) => void;

export const attractionImportance = ({
  attractionGroup,
  mustVisit,
  category
}: Pick<Attraction, "attractionGroup" | "mustVisit" | "category">): {
  label: string;
  Icon: typeof Star16Regular;
  tone: (typeof importance)[keyof typeof importance]["tone"];
} => {
  const column = attractionGroup === "PRIMARY" ? columns[0] : columns[1];
  const mark = mustVisit ? column.marked : column.unmarked;
  return category === "EATERY"
    ? { ...mark, label: `Eatery: ${mark.label}`, Icon: Food16Regular }
    : mark;
};

const AttractionCard = ({
  attraction,
  days,
  scheduleBlocked,
  formatDate,
  onSchedule,
  onGrab,
  onRelease,
  onOpenFacts
}: {
  attraction: Attraction;
  days: Days;
  scheduleBlocked: boolean;
  formatDate: (date: string) => string;
  onSchedule: ScheduleAttraction;
  onGrab: (item: DraggedItineraryItem) => void;
  onRelease: () => void;
  onOpenFacts: OpenAttractionFacts;
}): ReactElement => {
  const classes = useClasses();
  const factsId = useId();
  const addButton = useRef<HTMLButtonElement>(null);
  const eatery = attraction.category === "EATERY";
  const { Icon, tone, label } = attractionImportance(attraction);
  const { interaction, nameButton, dragHandle } = useItineraryCard({
    item: { kind: "pool", attraction },
    blocked: scheduleBlocked,
    onGrab,
    onRelease,
    onOpenFacts
  });
  return (
    <Card
      role="article"
      size="small"
      appearance="outline"
      focusMode="off"
      aria-labelledby={attractionNameId(attraction.attractionId)}
      aria-describedby={factsId}
      className={classes.unscheduledCard}
      {...interaction}
    >
      <CardHeader
        className={classes.unscheduledCardHeader}
        header={{
          className: classes.iconLabel,
          children: (
            <>
              {dragHandle}
              <Icon aria-hidden className={classes[tone]} />
              {nameButton}
            </>
          )
        }}
        description={{
          id: factsId,
          className: classes.unscheduledFacts,
          children: (
            <>
              <Caption1 className={eatery ? undefined : classes.visuallyHidden}>
                {label}
              </Caption1>
              <TripAttractionCardFacts attraction={attraction} showMissing />
            </>
          )
        }}
        action={
          <Menu>
            <MenuTrigger disableButtonEnhancement>
              <Button
                ref={addButton}
                id={`itinerary-add-${attraction.attractionId}`}
                appearance="subtle"
                size="small"
                icon={<Add16Regular />}
                aria-label={`Add ${attraction.name}`}
                disabledFocusable={scheduleBlocked}
              />
            </MenuTrigger>
            <MenuPopover>
              <MenuList className={classes.dateList}>
                {days.map((day) => (
                  <MenuItem
                    key={day.id}
                    disabled={scheduleBlocked}
                    onClick={() =>
                      onSchedule(attraction, day, addButton.current)
                    }
                  >
                    {formatDate(day.date)}
                  </MenuItem>
                ))}
              </MenuList>
            </MenuPopover>
          </Menu>
        }
      />
    </Card>
  );
};

const groupByPlace = (
  attractions: Attraction[],
  boardPlaceOrder: readonly string[]
): [string, Attraction[]][] => {
  const places = new Map<string, Attraction[]>();
  for (const attraction of attractions) {
    const cards = places.get(attraction.place);
    if (cards) cards.push(attraction);
    else places.set(attraction.place, [attraction]);
  }
  // Keep the open board's place order; new places follow in server order.
  const position = new Map(
    boardPlaceOrder.map((place, index) => [place, index])
  );
  return Array.from(places).sort(
    ([left], [right]) =>
      (position.get(left) ?? boardPlaceOrder.length) -
      (position.get(right) ?? boardPlaceOrder.length)
  );
};

export const UnscheduledAttractions = ({
  attractions,
  boardPlaceOrder,
  prepareBlocked,
  onPrepare,
  days,
  formatDate,
  scheduleBlocked,
  onSchedule,
  onGrab,
  onRelease,
  onOpenFacts,
  onDropMember
}: {
  attractions: Attraction[];
  boardPlaceOrder: readonly string[];
  prepareBlocked: boolean;
  onPrepare: () => void;
  days: Days;
  formatDate: (date: string) => string;
  scheduleBlocked: boolean;
  onSchedule: ScheduleAttraction;
  onGrab: (item: DraggedItineraryItem) => void;
  onRelease: () => void;
  onOpenFacts: OpenAttractionFacts;
  onDropMember?: () => void;
}): ReactElement => {
  const classes = useClasses();
  const titleId = useId();
  return (
    <Card
      role="region"
      aria-labelledby={titleId}
      className={classes.unscheduledAttractions}
      onDragOver={(event) => {
        if (!onDropMember) return;
        event.preventDefault();
        event.dataTransfer.dropEffect = "move";
      }}
      onDrop={(event) => {
        if (!onDropMember) return;
        event.preventDefault();
        onDropMember();
      }}
    >
      <Subtitle2 as="h2" id={titleId} className={classes.unscheduledHeading}>
        Unscheduled attractions
      </Subtitle2>
      {attractions.length === 0 && (
        <>
          <Text>No attractions are available to schedule.</Text>
          <Button
            appearance="secondary"
            className={classes.unscheduledPrepare}
            disabled={prepareBlocked}
            onClick={onPrepare}
          >
            Find more attractions on the board
          </Button>
        </>
      )}
      {columns.map(({ group, title, marked, unmarked }) => {
        const places = groupByPlace(
          attractions.filter(
            (attraction) => attraction.attractionGroup === group
          ),
          boardPlaceOrder
        );
        if (!places.length) return null;
        return (
          <section
            aria-label={title}
            className={classes.unscheduledGroup}
            key={group}
          >
            <Text
              as="h3"
              weight="semibold"
              className={classes.unscheduledHeading}
            >
              {title}
            </Text>
            <List className={classes.unscheduledLegend}>
              {[marked, unmarked].map(({ label, Icon, tone }) => (
                <ListItem key={label}>
                  <Caption1 className={classes.iconLabel}>
                    <Icon aria-hidden className={classes[tone]} /> {label}
                  </Caption1>
                </ListItem>
              ))}
            </List>
            {places.map(([place, cards]) => (
              <div className={classes.unscheduledGroup} key={place}>
                <Caption1Strong as="h4" className={classes.unscheduledHeading}>
                  {place}
                </Caption1Strong>
                {/* Fluent List expects grid navigation for focusable children. */}
                <ul className={classes.unscheduledCards}>
                  {cards.map((attraction) => (
                    <li key={attraction.attractionId}>
                      <AttractionCard
                        attraction={attraction}
                        days={days}
                        formatDate={formatDate}
                        scheduleBlocked={scheduleBlocked}
                        onSchedule={onSchedule}
                        onGrab={onGrab}
                        onRelease={onRelease}
                        onOpenFacts={onOpenFacts}
                      />
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </section>
        );
      })}
    </Card>
  );
};
