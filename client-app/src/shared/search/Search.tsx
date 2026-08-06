import { Button, SearchBox } from "@fluentui/react-components";
import { useRef, useState } from "react";
import { useClasses } from "./Search.styles";
import { SearchProps } from "./Search.types";
import { Flex } from "../ui/Flex";
import { FocusRegion, FocusRegionHandle } from "../ui/FocusRegion";

export const Search: React.FunctionComponent<SearchProps> = (props) => {
  const [value, setValue] = useState("");
  const classes = useClasses();

  const focusZoneRef = useRef<FocusRegionHandle>(null);
  const handleTextFieldKeyDown = (event) => {
    if (event.key === "ArrowDown") {
      focusZoneRef.current!.focus();
    }
  };

  return (
    <Flex align="center" className={classes.container}>
      <SearchBox
        onKeyDown={handleTextFieldKeyDown}
        placeholder="Search"
        dismiss={{ role: "button", "aria-label": "Clear text" }}
        onChange={(event, data) => {
          setValue(data.value);
          props.onSearchTyped(event, data.value);
          if (!data.value) {
            props.setItems([]);
          }
        }}
        className={classes.searchBox}
        value={value}
      />
      <FocusRegion role="grid" className={classes.dropdown} ref={focusZoneRef}>
        {props.items.map((item) => (
          <Button
            key={`${item.value}-${item.id}`}
            role="menuitem"
            appearance="secondary"
            className={classes.button}
            aria-label={item.value}
            onFocus={() => setValue(item.value)}
            onClick={(_event) => {
              props.onFindItem(item.id);
              setValue("");
            }}
          >
            {item.value}
          </Button>
        ))}
      </FocusRegion>
    </Flex>
  );
};
