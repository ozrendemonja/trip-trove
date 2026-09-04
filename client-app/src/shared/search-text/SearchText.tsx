import { mergeClasses } from "@fluentui/react-components";
import React, { useState } from "react";
import { Suggestion } from "../../features/continent/domain/Suggestion.types.";
import { Autocomplete } from "../search/Autocomplete";
import {
  AutocompleteController,
  FormSearchPolicy
} from "../search/AutocompleteController";
import { InputField } from "../ui/forms/InputField";
import { useClasses } from "./SearchText.styles";
import { SearchTextProps } from "./SearchText.types";

export const SearchText: React.FunctionComponent<SearchTextProps> = (props) => {
  const classes = useClasses();
  const [controller] = useState(() => {
    const nextController = new AutocompleteController<Suggestion>(
      new FormSearchPolicy()
    );
    if (props.initialValue) {
      nextController.selectSuggestion({ id: 0, value: props.initialValue });
    }
    return nextController;
  });
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
  const dropdownClassName = props.suggestionsInFlow
    ? classes.inFlowDropdown
    : undefined;
  const buttonClassName = mergeClasses(
    classes.button,
    props.suggestionsInFlow ? classes.inFlowButton : undefined
  );

  return (
    <div className={rootClassName}>
      <Autocomplete
        controller={controller}
        getSuggestions={props.getSuggestions}
        dropdownClassName={dropdownClassName}
        suggestionClassName={buttonClassName}
        onSuggestionSelected={(suggestion) => {
          props.onSelectItem(suggestion.id as number);
          props.onSelectValue?.(suggestion.value);
        }}
        renderInput={({
          query,
          hasSelectedSuggestion,
          onQueryChange,
          onKeyDown
        }) => (
          <InputField
            onKeyDown={onKeyDown}
            label={props.label}
            placeholder={props.placeholder}
            required={props.required}
            showRequiredIndicator={props.showRequiredIndicator}
            multiline={props.multiline}
            onChange={(_event, newValue: string | undefined): void => {
              if (hasSelectedSuggestion) {
                props.onSelectItem(undefined);
              }
              const nextQuery = newValue ?? "";
              onQueryChange(nextQuery);
              props.onSelectValue?.(nextQuery);
            }}
            className={searchBoxClassName}
            value={query}
            validate={props.validate}
          />
        )}
      />
    </div>
  );
};
