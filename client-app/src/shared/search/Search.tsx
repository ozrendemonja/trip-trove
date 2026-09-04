import { SearchBox, mergeClasses } from "@fluentui/react-components";
import React, { useState } from "react";
import { Suggestion } from "../../features/continent/domain/Suggestion.types.";
import { Flex } from "../ui/Flex";
import { Autocomplete } from "./Autocomplete";
import {
  AutocompleteController,
  ListSearchPolicy
} from "./AutocompleteController";
import { useClasses } from "./Search.styles";
import { SearchProps } from "./Search.types";

export const Search: React.FunctionComponent<SearchProps> = (props) => {
  const classes = useClasses();
  const [controller] = useState(
    () => new AutocompleteController<Suggestion>(new ListSearchPolicy())
  );

  return (
    <Flex align="center" className={classes.container}>
      <Autocomplete
        controller={controller}
        suggestions={props.items}
        onSuggestionSelected={(suggestion) => props.onFindItem(suggestion.id)}
        renderInput={({ query, onQueryChange, onKeyDown }) => (
          <SearchBox
            onKeyDown={onKeyDown}
            placeholder="Search"
            dismiss={{ role: "button", "aria-label": "Clear text" }}
            onChange={(event, data) => {
              onQueryChange(data.value);
              props.onSearchTyped(event, data.value);
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
