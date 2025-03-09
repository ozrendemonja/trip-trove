import {
  ContextualMenu,
  DefaultButton,
  FontWeights,
  getTheme,
  IButtonStyles,
  IconButton,
  IDragOptions,
  IIconProps,
  mergeStyleSets,
  Modal,
  Separator,
  Stack,
  Text
} from "@fluentui/react";
import { useBoolean, useId } from "@fluentui/react-hooks";
import { FilterProps } from "./Filter.types";
import { FilterElement } from "./FilterElement";

// Normally the drag options would be in a constant, but here the toggle can modify keepInBounds
const dragOptions: IDragOptions = {
  moveMenuItemText: "Move",
  closeMenuItemText: "Close",
  menu: ContextualMenu,
  keepInBounds: false,
  dragHandleSelector: ".ms-Modal-scrollableContent > div:first-child"
};
const theme = getTheme();

const cancelIcon: IIconProps = { iconName: "Cancel" };

const contentStyles = mergeStyleSets({
  container: {
    display: "flex",
    flexFlow: "column nowrap",
    alignItems: "stretch"
  },
  header: [
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    theme.fonts.xLargePlus,
    {
      flex: "1 1 auto",
      borderTop: `4px solid ${theme.palette.themePrimary}`,
      color: theme.palette.neutralPrimary,
      display: "flex",
      alignItems: "center",
      fontWeight: FontWeights.semibold,
      padding: "12px 12px 14px 24px"
    }
  ],
  heading: {
    // color: theme.palette.neutralPrimary,
    fontWeight: FontWeights.semibold,
    fontSize: "inherit",
    margin: "0"
  },
  body: {
    flex: "4 4 auto",
    padding: "0 24px 24px 24px",
    overflowY: "hidden",
    selectors: {
      p: { margin: "14px 0" },
      "p:first-child": { marginTop: 0 },
      "p:last-child": { marginBottom: 0 }
    }
  }
});

const iconButtonStyles: Partial<IButtonStyles> = {
  root: {
    color: theme.palette.neutralPrimary,
    marginLeft: "auto",
    marginTop: "4px",
    marginRight: "2px"
  },
  rootHovered: {
    color: theme.palette.neutralDark
  }
};

export const Filter: React.FunctionComponent<FilterProps> = (props) => {
  const titleId = useId("attraction-list-user-filter");
  const [isModalOpen, { setTrue: showModal, setFalse: hideModal }] =
    useBoolean(false);

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
      <DefaultButton
        onClick={showModal}
        text="Filters"
        iconProps={{ iconName: "Equalizer" }}
        styles={{ root: { borderRadius: "25px" } }}
      />
      <Modal
        titleAriaId={titleId}
        isOpen={isModalOpen}
        onDismiss={hideModal}
        isBlocking={false}
        containerClassName={contentStyles.container}
        dragOptions={dragOptions}
      >
        <div className={contentStyles.header}>
          <Text as="h2" className={contentStyles.heading} id={titleId}>
            Search filters
          </Text>
          <IconButton
            styles={iconButtonStyles}
            iconProps={cancelIcon}
            ariaLabel="Close attraction filter modal"
            onClick={hideModal}
          />
        </div>
        <Stack
          horizontal
          tokens={{ childrenGap: 48 }}
          styles={{ root: { marginRight: 40 } }}
        >
          <Stack
            styles={{
              root: { marginLeft: 15, ".ms-Link": { marginTop: 10 } }
            }}
          >
            <Text styles={{ root: { fontWeight: 600 } }}>
              Geographical Scope
            </Text>
            <Separator></Separator>
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
          </Stack>
          <Stack
            styles={{
              root: { marginLeft: 15, ".ms-Link": { marginTop: 10 } }
            }}
          >
            <Text styles={{ root: { fontWeight: 600 } }}>Must visit</Text>
            <Separator></Separator>
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
          </Stack>
          <Stack
            styles={{
              root: { marginLeft: 15, ".ms-Link": { marginTop: 10 } }
            }}
          >
            <Text styles={{ root: { fontWeight: 600 } }}>Historic</Text>
            <Separator></Separator>
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
          </Stack>
          <Stack
            styles={{
              root: { marginLeft: 15, ".ms-Link": { marginTop: 10 } }
            }}
          >
            <Text styles={{ root: { fontWeight: 600 } }}>Category</Text>
            <Separator></Separator>
            {categories.map((text, index) => (
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
          </Stack>
          <Stack
            styles={{
              root: { marginLeft: 15, ".ms-FilterElement": { marginTop: 10 } }
            }}
          >
            <Text styles={{ root: { fontWeight: 600 } }}>Type</Text>
            <Separator></Separator>
            {types.map((text, index) => (
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
          </Stack>
        </Stack>
      </Modal>
    </div>
  );
};
