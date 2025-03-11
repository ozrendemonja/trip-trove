import {
  DefaultButton,
  FocusZone,
  FocusZoneDirection,
  SearchBox,
  Stack
} from "@fluentui/react";
import { LegacyRef, useRef, useState } from "react";
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

  const focusZoneRef = useRef(null);
  const handleTextFieldKeyDown = (event) => {
    if (event.key === "ArrowDown") {
      focusZoneRef.current!.focus();
    }
  };

  return (
    <Stack verticalAlign={"center"}>
      <SearchBox
        onKeyDown={handleTextFieldKeyDown}
        placeholder="Search"
        ref={getBottomPosition}
        onClear={() => {
          props.setItems([]);
          setValue("");
        }}
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
        componentRef={focusZoneRef}
      >
        {props.items.map((item) => (
          <DefaultButton
            key={`${item.value}-${item.id}`}
            role="menuitem"
            className={classes.button}
            ariaLabel={item.value}
            onFocus={() => setValue(item.value)}
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
