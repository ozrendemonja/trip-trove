import {
  DefaultButton,
  FocusZone,
  FocusZoneDirection,
  SearchBox,
  Stack
} from "@fluentui/react";
import { LegacyRef, useState } from "react";
import { useClasses } from "./Search.styles";
import { SearchProps } from "./Search.types";

export const Search: React.FunctionComponent<SearchProps> = (props) => {
  const [dropdownTopPosition, setDropdownTopPosition] = useState<number>(30);
  const [value, setValue] = useState("");
  const classes = useClasses(dropdownTopPosition);

  const getBottomPosition = (element: LegacyRef) => {
    if (element) {
      setDropdownTopPosition(
        element.getBoundingClientRect().top +
          element.getBoundingClientRect().height
      );
    }
  };

  return (
    <Stack verticalAlign={"center"}>
      <SearchBox
        placeholder="Search"
        ref={getBottomPosition}
        onChange={(event, newValue) => {
          setValue(newValue ?? "");
          props.onSearchTyped(event, newValue);
        }}
        className={classes.searchBox}
        value={value}
      />
      <FocusZone
        direction={FocusZoneDirection.vertical}
        isCircularNavigation={true}
        role="grid"
        className={classes.dropdown}
      >
        {props.items.map((item) => (
          <DefaultButton
            key={`${item.value}-${item.id}`}
            role="menuitem"
            className={classes.button}
            onClick={(_event) => {
              props.onFindItem(item.id);
              setValue("");
            }}
          >
            {item.value}
          </DefaultButton>
        ))}
      </FocusZone>
    </Stack>
  );
};
