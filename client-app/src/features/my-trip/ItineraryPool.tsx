import {
  Button,
  Caption1,
  Caption1Strong,
  Card,
  CardHeader,
  List,
  ListItem,
  Subtitle2,
  Text
} from "@fluentui/react-components";
import {
  Circle16Regular,
  Food16Regular,
  Star16Filled,
  Star16Regular
} from "@fluentui/react-icons";
import { useId, type ReactElement } from "react";
import type { GetItineraryResponse } from "../../clients/manager";
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

type Importance = (typeof importance)[keyof typeof importance];

const AttractionCard = ({
  attraction,
  mark
}: {
  attraction: Attraction;
  mark: Importance;
}): ReactElement => {
  const classes = useClasses();
  const nameId = useId();
  const factsId = useId();
  const eatery = attraction.category === "EATERY";
  const Icon = eatery ? Food16Regular : mark.Icon;
  return (
    <Card
      role="article"
      tabIndex={0}
      size="small"
      appearance="outline"
      aria-labelledby={nameId}
      aria-describedby={factsId}
      className={classes.poolCard}
    >
      <CardHeader
        className={classes.poolCardHeader}
        header={{
          className: classes.poolName,
          children: (
            <>
              <Icon aria-hidden className={classes[mark.tone]} />
              <Text id={nameId} weight="semibold">
                {attraction.name}
              </Text>
            </>
          )
        }}
        description={{
          id: factsId,
          className: classes.poolFacts,
          children: (
            <>
              <Caption1 className={eatery ? undefined : classes.visuallyHidden}>
                {eatery ? `Eatery: ${mark.label}` : mark.label}
              </Caption1>
              <Caption1>
                {attraction.workingHours?.trim()
                  ? `Working hours: ${attraction.workingHours}`
                  : "Working hours not recorded"}
              </Caption1>
              <Caption1>
                {attraction.visitDuration?.trim()
                  ? `Visit duration: ${attraction.visitDuration}`
                  : "Visit duration not recorded"}
              </Caption1>
            </>
          )
        }}
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

export const ItineraryPool = ({
  attractions,
  boardPlaceOrder,
  prepareBlocked,
  onPrepare
}: {
  attractions: Attraction[];
  boardPlaceOrder: readonly string[];
  prepareBlocked: boolean;
  onPrepare: () => void;
}): ReactElement => {
  const classes = useClasses();
  const titleId = useId();
  return (
    <Card role="region" aria-labelledby={titleId} className={classes.pool}>
      <Subtitle2 as="h2" id={titleId} className={classes.poolHeading}>
        Unscheduled attractions
      </Subtitle2>
      {attractions.length === 0 && (
        <>
          <Text>No attractions are available to schedule.</Text>
          <Button
            appearance="secondary"
            className={classes.poolPrepare}
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
          <section aria-label={title} className={classes.poolGroup} key={group}>
            <Text as="h3" weight="semibold" className={classes.poolHeading}>
              {title}
            </Text>
            <List className={classes.poolLegend}>
              {[marked, unmarked].map(({ label, Icon, tone }) => (
                <ListItem key={label}>
                  <Caption1 className={classes.poolName}>
                    <Icon aria-hidden className={classes[tone]} /> {label}
                  </Caption1>
                </ListItem>
              ))}
            </List>
            {places.map(([place, cards]) => (
              <div className={classes.poolGroup} key={place}>
                <Caption1Strong as="h4" className={classes.poolHeading}>
                  {place}
                </Caption1Strong>
                {/* Fluent List expects grid navigation for focusable children. */}
                <ul className={classes.poolCards}>
                  {cards.map((attraction) => (
                    <li key={attraction.attractionId}>
                      <AttractionCard
                        attraction={attraction}
                        mark={attraction.mustVisit ? marked : unmarked}
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
