import { Dropdown, IDropdownOption, Text } from "@fluentui/react";
import React from "react";
import { Search } from "../search/Search";
import useClasses from "./ListHeader.styles";
import { ListHeaderProps } from "./ListHeader.types";

const ListHeader: React.FunctionComponent<ListHeaderProps> = (props) => {
  const classes = useClasses();
  const onRenderTitle = (options?: IDropdownOption[]): JSX.Element => {
    const selectedOption = options;
    return (
      <Text as={"span"} className={classes.dropdownSelectedOption}>
        <Text as={"span"}>Sort by: </Text>
        {selectedOption ? selectedOption[0].text : ""}
      </Text>
    );
  };

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
        />
      )}
      <Dropdown
        onChange={props.onSortOptionChange}
        className={classes.dropdown}
        placeholder="Sort by:"
        options={props.sortOptions}
        onRenderTitle={(options) => onRenderTitle(options)}
      />
    </div>
  );
};

export default ListHeader;
