import { Link } from "@fluentui/react-components";
import { Search24Regular } from "@fluentui/react-icons";
import {
  searchAttraction,
  searchCity,
  searchCountry,
  searchMainAttraction,
  searchRegion
} from "../continent/infra/ManagerApi";
import { SearchTextProps } from "../../shared/search-text/SearchText.types";
import EditProperty from "../../shared/list-element/ui/edit-property/EditProperty";
import { useClasses } from "./MyTrip.styles";
import React, { useState } from "react";
import { SearchText } from "../../shared/search-text/SearchText";
import { Flex } from "../../shared/ui/Flex";

const searchConfig: Omit<SearchTextProps, "getSuggestions" | "onSelectItem"> = {
  label: "",
  placeholder: "Search",
  required: false
};

interface SearchOptionAction {
  key: string;
  name: string;
  onClick: () => void;
  className: string;
  selected: boolean;
}

interface SearchAttractionsModalInterface {
  text: string;
  onUpdateClick: (value: SearchTarget) => void;
}

export interface SearchTarget {
  whereToSearch: string;
  id: number;
}

const country = "Country";
const region = "Region";
const city = "City";
const mainAttraction = "Main attraction";
const attraction = "Attraction";
const searchOptions = [
  { key: "country-search", name: country, searchQuery: searchCountry },
  { key: "region-search", name: region, searchQuery: searchRegion },
  { key: "city-search", name: city, searchQuery: searchCity },
  {
    key: "main-attraction-search",
    name: mainAttraction,
    searchQuery: searchMainAttraction
  },
  { key: "attraction-search", name: attraction, searchQuery: searchAttraction }
];

const SearchAttractionsModal: React.FunctionComponent<
  SearchAttractionsModalInterface
> = (props) => {
  const classes = useClasses();

  const [searchQuery, setSearchQuery] = useState(() => searchCountry);
  const [selected, setSelected] = useState<string>(country);
  const [selectedId, setSelectedId] = useState<number | undefined>(undefined);

  return (
    <EditProperty
      editIconAriaLabel={"Search"}
      editIcon={<Search24Regular />}
      text={props.text}
      onUpdateClick={async () => {
        props.onUpdateClick({ whereToSearch: selected, id: selectedId ?? -1 });
      }}
      isFormValid={selectedId != undefined}
      contentClassName={classes.searchModalContent}
    >
      <Flex gap={0} className={classes.searchModalLayout}>
        <div
          role="toolbar"
          aria-label="Search options"
          className={classes.searchOptions}
        >
          {searchOptions
            .map((option): SearchOptionAction => ({
              key: option.key,
              name: option.name,
              onClick: () => {
                setSearchQuery(() => option.searchQuery);
                setSelected(option.name);
                setSelectedId(undefined);
              },
              className:
                selected == option.name
                  ? classes.selectedSearchOption
                  : classes.notSelectedSearchOption,
              selected: selected === option.name
            }))
            .map((item) => (
              <Link
                key={item.key}
                data-fluent-link
                className={item.className}
                aria-pressed={item.selected}
                onClick={item.onClick}
              >
                {item.name}
              </Link>
            ))}
        </div>
        <SearchText
          key={selected}
          {...searchConfig}
          getSuggestions={searchQuery}
          onSelectItem={(id: number | string | undefined) => {
            setSelectedId(Number(id));
          }}
        />
      </Flex>
    </EditProperty>
  );
};

export default SearchAttractionsModal;
