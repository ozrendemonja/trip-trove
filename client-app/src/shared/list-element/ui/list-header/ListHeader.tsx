import { SelectField } from "../../../ui/forms/SelectField";
import { Text } from "@fluentui/react-components";
import React from "react";
import useClasses from "./ListHeader.styles";
import { ListHeaderProps } from "./ListHeader.types";
import { Search } from "../../../search/Search";

const ListHeader: React.FunctionComponent<ListHeaderProps> = (props) => {
  const classes = useClasses();

  return (
    <div className={classes.root}>
      <Text as="h1" className={classes.header}>
        {props.text}
      </Text>
      {props.showSearchBar && (
        <Search
          onSearchTyped={props.onSearchTyped}
          onFindItem={props.onFindItem}
          items={props.items}
          setItems={props.setItems}
        />
      )}
      <SelectField
        onOptionSelect={props.onSortOptionChange}
        className={classes.dropdown}
        aria-label="Sort by"
        placeholder="Sort by:"
        choices={props.sortOptions}
        selectedValue={props.selectedSortValue}
        selectedValuePrefix="Sort by: "
      />
    </div>
  );
};

export default ListHeader;
