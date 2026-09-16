import { SearchBox, mergeClasses } from "@fluentui/react-components";
import React from "react";
import { Flex } from "../ui/Flex";
import { Autocomplete } from "./Autocomplete";
import {
  AutocompleteSuggestion,
  ListSearchPolicy
} from "./AutocompleteController";
import { useClasses } from "./Search.styles";
import { SearchProps } from "./Search.types";

const searchPolicy = new ListSearchPolicy();

export const Search = <TSuggestion extends AutocompleteSuggestion>(
  props: SearchProps<TSuggestion>
): React.ReactElement => {
  const classes = useClasses();

  return (
    <Flex align="center" className={classes.container}>
      <Autocomplete<TSuggestion>
        policy={searchPolicy}
        suggestions={props.items}
        onSuggestionSelected={(suggestion) => props.onFindItem(suggestion.id)}
        renderInput={({ query, onQueryChange, onKeyDown }) => (
          <SearchBox
            onKeyDown={onKeyDown}
            placeholder="Search"
            dismiss={{ role: "button", "aria-label": "Clear text" }}
            onChange={(_event, data) => {
              onQueryChange(data.value);
              props.onSearchTyped?.(data.value);
              if (!data.value) {
                props.setItems([]);
              }
            }}
            className={mergeClasses(classes.searchBox, props.className)}
            value={query}
          />
        )}
      />
    </Flex>
  );
};
