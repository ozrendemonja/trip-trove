import {
  DefaultButton,
  FocusZone,
  FocusZoneDirection,
  mergeStyleSets,
  TextField
} from "@fluentui/react";
import { useBoolean } from "@fluentui/react-hooks";
import { LegacyRef, useEffect, useState } from "react";
import { Suggestion } from "../../features/continent/domain/Suggestion.types.";
import { positionSuggestionDropdown, useClasses } from "./SearchText.styles";
import { SearchTextProps } from "./SearchText.types";

export const SearchText: React.FunctionComponent<SearchTextProps> = (props) => {
  let classes = useClasses();

  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [
    isSuggestionChosen,
    { setFalse: deselectSuggestion, setTrue: selectSuggestion }
  ] = useBoolean(false);

  useEffect(() => {
    if (isSuggestionChosen) {
      return;
    } else if (query && query.trim().length >= 3) {
      props.getSuggestions(query).then(setSuggestions);
    }
  }, [query]);

  const getBottomPosition = (element: LegacyRef) => {
    if (element) {
      const position =
        element.getBoundingClientRect().top +
        element.getBoundingClientRect().height;

      const isNotInsideModal = position > 200;
      if (isNotInsideModal) {
        classes = mergeStyleSets(classes, positionSuggestionDropdown(position));
      }
    }
  };

  return (
    <div ref={getBottomPosition}>
      <TextField
        label={props.label}
        placeholder={props.placeholder}
        required={props.required}
        onChange={(_event, newValue: string | undefined): void => {
          if (isSuggestionChosen) {
            props.onSelectItem(undefined);
          }
          setQuery(newValue ?? "");
          deselectSuggestion();
        }}
        className={classes.searchBox}
        value={query}
        onGetErrorMessage={props.onGetErrorMessage}
      />
      <FocusZone
        direction={FocusZoneDirection.vertical}
        isCircularNavigation={true}
        role="grid"
        className={classes.dropdown}
      >
        {suggestions.map((item) => (
          <DefaultButton
            key={`${item.value}-${item.id}`}
            role="menuitem"
            className={classes.button}
            ariaLabel={item.value}
            onClick={(_event) => {
              setQuery(item.value);
              props.onSelectItem(item.id);
              setSuggestions([]);
              selectSuggestion();
            }}
          >
            {item.value}
          </DefaultButton>
        ))}
      </FocusZone>
    </div>
  );
};
