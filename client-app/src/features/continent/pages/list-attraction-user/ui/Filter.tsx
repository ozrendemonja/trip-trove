import {
  Button,
  Dialog,
  DialogSurface,
  Divider,
  Text
} from "@fluentui/react-components";
import { Dismiss24Regular, Filter24Regular } from "@fluentui/react-icons";
import React from "react";
import { useBooleanState } from "../../../../../shared/hooks/useBooleanState";
import { useClasses } from "./Filter.styles";
import { FilterProps } from "./Filter.types";
import { FilterElement } from "./FilterElement";
import { Flex } from "../../../../../shared/ui/Flex";

export const Filter: React.FunctionComponent<FilterProps> = (props) => {
  const classes = useClasses();

  const titleId = React.useId();
  const [isModalOpen, { setTrue: showModal, setFalse: hideModal }] =
    useBooleanState(false);

  const categories = [
    "POINT_OF_INTEREST_AND_LANDMARK",
    "HISTORIC_SITE",
    "RELIGIOUS_SITE",
    "ARENA_AND_STADIUM",
    "OTHER_LANDMARK",
    "SPECIALITY_MUSEUM",
    "ART_MUSEUM",
    "HISTORY_MUSEUM",
    "SCIENCE_MUSEUM",
    "OTHER_MUSEUM",
    "PARK",
    "NATURE_AND_WILDLIFE_AREA",
    "OTHER_NATURE_AND_PARK",
    "LAND_BASED_ACTIVITY",
    "AIR_BASED_ACTIVITY",
    "WATER_BASED_ACTIVITY",
    "OTHER_OUTDOOR_ACTIVITY",
    "SPORTING_EVENT",
    "CULTURAL_EVENT",
    "THEATRE_EVENT",
    "OTHER_EVENT",
    "SHOPPING",
    "ZOO_AND_AQUARIUM",
    "NIGHTLIFE",
    "FOOD",
    "DRINK",
    "WILDLIFE_TOUR",
    "EXTREME_SPORT_TOUR",
    "OTHER_TOUR",
    "WATER_AND_AMUSEMENT_PARK",
    "FILM_AND_TV_TOUR",
    "CLASS_AND_WORKSHOP",
    "OTHER_FUN_AND_GAME",
    "SPA_AND_WELLNESS",
    "EATERY",
    "BEVERAGE_SPOT"
  ];
  const types = ["IMMINENT_CHANGE", "POTENTIAL_CHANGE", "STABLE"];

  return (
    <div className={props.className}>
      <Button
        appearance="secondary"
        onClick={showModal}
        icon={<Filter24Regular />}
        className={classes.filterButton}
        style={{ marginTop: 30 }}
      >
        Filters
      </Button>
      <Dialog
        open={isModalOpen}
        modalType="non-modal"
        onOpenChange={(_event, data) => {
          if (!data.open) {
            hideModal();
          }
        }}
      >
        <DialogSurface className={classes.container} aria-labelledby={titleId}>
          <div className={classes.header}>
            <Text as="h2" id={titleId}>
              Search filters
            </Text>
            <Button
              appearance="subtle"
              className={classes.closeButton}
              icon={<Dismiss24Regular />}
              aria-label="Close attraction filter modal"
              onClick={hideModal}
            />
          </div>
          <div className={classes.body}>
            <Flex>
              <Text as={"h3"}>Geographical Scope</Text>
              <Divider />
              <FilterElement
                onClick={() => {
                  props.countrywide.onClick("true");
                  hideModal();
                }}
                isSelected={props.countrywide.has("true")}
              >
                Countrywide
              </FilterElement>
              <FilterElement
                onClick={() => {
                  props.countrywide.onClick("false");
                  hideModal();
                }}
                isSelected={props.countrywide.has("false")}
              >
                Local
              </FilterElement>
            </Flex>
            <Flex>
              <Text as={"h3"}>Must visit</Text>
              <Divider />
              <FilterElement
                onClick={() => {
                  props.mustVisit.onClick("true");
                  hideModal();
                }}
                isSelected={props.mustVisit.has("true")}
              >
                Must visit
              </FilterElement>
              <FilterElement
                onClick={() => {
                  props.mustVisit.onClick("false");
                  hideModal();
                }}
                isSelected={props.mustVisit.has("false")}
              >
                Skip-Worthy Spots
              </FilterElement>
            </Flex>
            <Flex>
              <Text as={"h3"}>Historic</Text>
              <Divider />
              <FilterElement
                onClick={() => {
                  props.traditional.onClick("true");
                  hideModal();
                }}
                isSelected={props.traditional.has("true")}
              >
                Traditional
              </FilterElement>
              <FilterElement
                onClick={() => {
                  props.traditional.onClick("false");
                  hideModal();
                }}
                isSelected={props.traditional.has("false")}
              >
                Modern
              </FilterElement>
            </Flex>
            <Flex>
              <Text as={"h3"}>Category</Text>
              <Divider />
              {categories.map((text) => (
                <FilterElement
                  key={text}
                  onClick={() => {
                    props.category.onClick(text);
                    hideModal();
                  }}
                  isSelected={props.category.has(text)}
                >
                  {text}
                </FilterElement>
              ))}
            </Flex>
            <Flex>
              <Text as={"h3"}>Type</Text>
              <Divider />
              {types.map((text) => (
                <FilterElement
                  key={text}
                  onClick={() => {
                    props.type.onClick(text);
                    hideModal();
                  }}
                  isSelected={props.type.has(text)}
                >
                  {text}
                </FilterElement>
              ))}
            </Flex>
          </div>
        </DialogSurface>
      </Dialog>
    </div>
  );
};
