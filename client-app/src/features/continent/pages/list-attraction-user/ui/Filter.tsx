import {
  ContextualMenu,
  DefaultButton,
  FontWeights,
  getTheme,
  IButtonStyles,
  Icon,
  IconButton,
  IDragOptions,
  IIconProps,
  Link,
  mergeStyleSets,
  Modal,
  Separator,
  Stack,
  Text
} from "@fluentui/react";
import { useBoolean, useId } from "@fluentui/react-hooks";
import { useSearchParams } from "react-router";
import { useClasses } from "./Filter.styles";

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

export const Filter: React.FunctionComponent = () => {
  const classes = useClasses();

  // Use useId() to ensure that the IDs are unique on the page.
  // (It's also okay to use plain strings and manually ensure uniqueness.)
  const titleId = useId("attraction-list-user-filter");
  const [isModalOpen, { setTrue: showModal, setFalse: hideModal }] =
    useBoolean(false);

  //--------------------------------
  const [searchParams, setSearchParams] = useSearchParams();
  const toggleQueryParam = (parameter: string, value: string) => {
    if (searchParams.has(parameter) && searchParams.get(parameter) === value) {
      searchParams.delete(parameter);
    } else {
      searchParams.set(parameter, value);
    }
    setSearchParams(searchParams);
  };
  //--------------------------------

  return (
    <div>
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
            ariaLabel="Close popup modal"
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
            <Link
              className={
                searchParams.has("isCountrywide") &&
                searchParams.get("isCountrywide") === "true"
                  ? classes.filterElementSelected
                  : classes.filterElementNotSelected
              }
              onClick={() => {
                toggleQueryParam("isCountrywide", "true");
                // setAttractionCustomizer(
                //   new AttractionListCustomizerUser(setItems, setColumns)
                // );
                // toggleReloadData();
                hideModal();
              }}
            >
              Countrywide{" "}
              {searchParams.has("isCountrywide") &&
                searchParams.get("isCountrywide") === "true" && (
                  <Icon
                    styles={{ root: { marginLeft: 10 } }}
                    iconName="Clear"
                  />
                )}
            </Link>
            <Link
              className={
                searchParams.has("isCountrywide") &&
                searchParams.get("isCountrywide") === "false"
                  ? classes.filterElementSelected
                  : classes.filterElementNotSelected
              }
              onClick={() => {
                toggleQueryParam("isCountrywide", "false");
                // setAttractionCustomizer(
                //   new AttractionListCustomizerUser(setItems, setColumns)
                // );
                // toggleReloadData();
                hideModal();
              }}
            >
              Local
              {searchParams.has("isCountrywide") &&
                searchParams.get("isCountrywide") === "false" && (
                  <Icon
                    styles={{ root: { marginLeft: 10 } }}
                    iconName="Clear"
                  />
                )}
            </Link>
          </Stack>
          <Stack
            styles={{
              root: { marginLeft: 15, ".ms-Link": { marginTop: 10 } }
            }}
          >
            <Text styles={{ root: { fontWeight: 600 } }}>Must visit</Text>
            <Separator></Separator>
            <Link
              styles={{
                root: { color: "grey" }
              }}
            >
              Must visit
            </Link>
            <Link
              styles={{
                root: { color: "grey" }
              }}
            >
              Skip-Worthy Spots
            </Link>
          </Stack>
          <Stack
            styles={{
              root: { marginLeft: 15, ".ms-Link": { marginTop: 10 } }
            }}
          >
            <Text styles={{ root: { fontWeight: 600 } }}>Historic</Text>
            <Separator></Separator>
            <Link
              styles={{
                root: { color: "grey" }
              }}
            >
              Traditional
            </Link>
            <Link
              styles={{
                root: { color: "grey" }
              }}
            >
              Modern
            </Link>
          </Stack>
          <Stack
            styles={{
              root: { marginLeft: 15, ".ms-Link": { marginTop: 10 } }
            }}
          >
            <Text styles={{ root: { fontWeight: 600 } }}>Category</Text>
            <Separator></Separator>
            <Link
              styles={{
                root: { color: "grey" }
              }}
            >
              POINT_OF_INTEREST_AND_LANDMARK
            </Link>
            <Link
              styles={{
                root: { color: "grey" }
              }}
            >
              HISTORIC_SITE
            </Link>
            <Link
              styles={{
                root: { color: "grey" }
              }}
            >
              RELIGIOUS_SITE
            </Link>
            <Link
              styles={{
                root: { color: "grey" }
              }}
            >
              ARENA_AND_STADIUM
            </Link>
            <Link
              styles={{
                root: { color: "grey" }
              }}
            >
              OTHER_LANDMARK
            </Link>
            <Link
              styles={{
                root: { color: "grey" }
              }}
            >
              SPECIALITY_MUSEUM
            </Link>
            <Link
              styles={{
                root: { color: "grey" }
              }}
            >
              ART_MUSEUM
            </Link>
            <Link
              styles={{
                root: { color: "grey" }
              }}
            >
              HISTORY_MUSEUM
            </Link>
            <Link
              styles={{
                root: { color: "grey" }
              }}
            >
              SCIENCE_MUSEUM
            </Link>
            <Link
              styles={{
                root: { color: "grey" }
              }}
            >
              OTHER_MUSEUM
            </Link>
            <Link
              styles={{
                root: { color: "grey" }
              }}
            >
              PARK
            </Link>
            <Link
              styles={{
                root: { color: "grey" }
              }}
            >
              NATURE_AND_WILDLIFE_AREA
            </Link>
            <Link
              styles={{
                root: { color: "grey" }
              }}
            >
              OTHER_NATURE_AND_PARK
            </Link>
            <Link
              styles={{
                root: { color: "grey" }
              }}
            >
              LAND_BASED_ACTIVITY
            </Link>
            <Link
              styles={{
                root: { color: "grey" }
              }}
            >
              AIR_BASED_ACTIVITY
            </Link>
            <Link
              styles={{
                root: { color: "grey" }
              }}
            >
              WATER_BASED_ACTIVITY
            </Link>
            <Link
              styles={{
                root: { color: "grey" }
              }}
            >
              OTHER_OUTDOOR_ACTIVITY
            </Link>
            <Link
              styles={{
                root: { color: "grey" }
              }}
            >
              SPORTING_EVENT
            </Link>
            <Link
              styles={{
                root: { color: "grey" }
              }}
            >
              CULTURAL_EVENT
            </Link>
            <Link
              styles={{
                root: { color: "grey" }
              }}
            >
              THEATRE_EVENT
            </Link>
            <Link
              styles={{
                root: { color: "grey" }
              }}
            >
              OTHER_EVENT
            </Link>
            <Link
              styles={{
                root: { color: "grey" }
              }}
            >
              SHOPPING
            </Link>
            <Link
              styles={{
                root: { color: "grey" }
              }}
            >
              ZOO_AND_AQUARIUM
            </Link>
            <Link
              styles={{
                root: { color: "grey" }
              }}
            >
              NIGHTLIFE
            </Link>
            <Link
              styles={{
                root: { color: "grey" }
              }}
            >
              FOOD
            </Link>
            <Link
              styles={{
                root: { color: "grey" }
              }}
            >
              DRINK
            </Link>
            <Link
              styles={{
                root: { color: "grey" }
              }}
            >
              WILDLIFE_TOUR
            </Link>
            <Link
              styles={{
                root: { color: "grey" }
              }}
            >
              EXTREME_SPORT_TOUR
            </Link>
            <Link
              styles={{
                root: { color: "grey" }
              }}
            >
              OTHER_TOUR
            </Link>
            <Link
              styles={{
                root: { color: "grey" }
              }}
            >
              WATER_AND_AMUSEMENT_PARK
            </Link>
            <Link
              styles={{
                root: { color: "grey" }
              }}
            >
              FILM_AND_TV_TOUR
            </Link>
            <Link
              styles={{
                root: { color: "grey" }
              }}
            >
              CLASS_AND_WORKSHOP
            </Link>
            <Link
              styles={{
                root: { color: "grey" }
              }}
            >
              OTHER_FUN_AND_GAME
            </Link>
            <Link
              styles={{
                root: { color: "grey" }
              }}
            >
              SPA_AND_WELLNESS
            </Link>
            <Link
              styles={{
                root: { color: "grey" }
              }}
            >
              EATERY
            </Link>
            <Link
              styles={{
                root: { color: "grey" }
              }}
            >
              BEVERAGE_SPOT
            </Link>
          </Stack>
          <Stack
            styles={{
              root: { marginLeft: 15, ".ms-Link": { marginTop: 10 } }
            }}
          >
            <Text styles={{ root: { fontWeight: 600 } }}>Type</Text>
            <Separator></Separator>
            <Link
              styles={{
                root: { color: "grey" }
              }}
            >
              IMMINENT_CHANGE
            </Link>
            <Link
              styles={{
                root: { color: "grey" }
              }}
            >
              POTENTIAL_CHANGE
            </Link>
            <Link
              styles={{
                root: { color: "grey" }
              }}
            >
              STABLE
            </Link>
          </Stack>
        </Stack>
      </Modal>
    </div>
  );
};
