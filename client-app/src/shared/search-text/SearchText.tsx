import { InputField } from "../ui/forms/InputField";
import { Button, mergeClasses } from "@fluentui/react-components";
import { useBooleanState } from "../hooks/useBooleanState";
import { useEffect, useRef, useState } from "react";
import { Suggestion } from "../../features/continent/domain/Suggestion.types.";
import { useClasses } from "./SearchText.styles";
import { SearchTextProps } from "./SearchText.types";
import { FocusRegion, FocusRegionHandle } from "../ui/FocusRegion";

export const SearchText: React.FunctionComponent<SearchTextProps> = (props) => {
  const classes = useClasses();

  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [
    isSuggestionChosen,
    { setFalse: deselectSuggestion, setTrue: selectSuggestion }
  ] = useBooleanState(false);
  const rootClassName = mergeClasses(
    classes.root,
    props.suggestionsInFlow ? classes.inFlowRoot : undefined,
    props.className
  );
  const searchBoxClassName = mergeClasses(
    classes.searchBox,
    props.suggestionsInFlow ? classes.inFlowSearchBox : undefined,
    props.searchBoxClassName
  );
  const dropdownClassName = mergeClasses(
    classes.dropdown,
    props.suggestionsInFlow ? classes.inFlowDropdown : undefined
  );
  const buttonClassName = mergeClasses(
    classes.button,
    props.suggestionsInFlow ? classes.inFlowButton : undefined
  );

  useEffect(() => {
    if (isSuggestionChosen) {
      return;
    } else if (query && query.trim().length >= 3) {
      props.getSuggestions(query).then(setSuggestions);
    }
  }, [query]);

  const focusZoneRef = useRef<FocusRegionHandle>(null);
  const handleTextFieldKeyDown = (event) => {
    if (event.key === "ArrowDown") {
      focusZoneRef.current!.focus();
    }
  };

  return (
    <div className={rootClassName}>
      <InputField
        onKeyDown={handleTextFieldKeyDown}
        label={props.label}
        placeholder={props.placeholder}
        required={props.required}
        showRequiredIndicator={props.showRequiredIndicator}
        multiline={props.multiline}
        onChange={(_event, newValue: string | undefined): void => {
          if (isSuggestionChosen) {
            props.onSelectItem(undefined);
          }
          setQuery(newValue ?? "");
          props.onSelectValue?.(newValue ?? "");
          deselectSuggestion();
        }}
        className={searchBoxClassName}
        value={query}
        validate={props.validate}
      />
      <FocusRegion ref={focusZoneRef} role="grid" className={dropdownClassName}>
        {suggestions.map((item) => (
          <Button
            key={`${item.value}-${item.id}`}
            role="menuitem"
            appearance="secondary"
            className={buttonClassName}
            aria-label={item.value}
            onClick={(_event) => {
              selectSuggestion();
              setQuery(item.value);
              props.onSelectItem(item.id);
              props.onSelectValue?.(item.value);
              setSuggestions([]);
            }}
          >
            {item.value}
          </Button>
        ))}
      </FocusRegion>
    </div>
  );
};
