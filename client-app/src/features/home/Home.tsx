import {
  IOverflowSetItemProps,
  Link,
  OverflowSet,
  Stack
} from "@fluentui/react";
import React, { useState } from "react";
import { useNavigate } from "react-router";
import Navigation from "../../shared/navigation/Navigation";
import { SearchText } from "../../shared/search-text/SearchText";
import { SearchTextProps } from "../../shared/search-text/SearchText.types";
import {
  searchCity,
  searchContinent,
  searchCountry,
  searchMainAttraction,
  searchRegion
} from "../continent/infra/ManagerApi";
import { useClasses } from "./Home.styles";

const searchConfig: Omit<SearchTextProps, "getSuggestions" | "onSelectItem"> = {
  label: "",
  placeholder: "Search",
  required: false
};

const onRenderItem = (item: IOverflowSetItemProps): JSX.Element => {
  return (
    <Link className={item.className} onClick={item.onClick}>
      {item.name}
    </Link>
  );
};

const continent = "Continent";
const country = "Country";
const region = "Region";
const city = "City";
const mainAttraction = "Main attraction";
const searchOptions = [
  { key: "continent-search", name: continent, searchQuery: searchContinent },
  { key: "country-search", name: country, searchQuery: searchCountry },
  { key: "region-search", name: region, searchQuery: searchRegion },
  { key: "city-search", name: city, searchQuery: searchCity },
  {
    key: "main-attraction-search",
    name: mainAttraction,
    searchQuery: searchMainAttraction
  }
];

export const Home: React.FunctionComponent = () => {
  const classes = useClasses();

  const [searchQuery, setSearchQuery] = useState(() => searchContinent);
  const navigate = useNavigate();

  const [selected, setSelected] = useState<string>(continent);

  return (
    <>
      <Navigation />
      <Stack tokens={{ childrenGap: 0 }} className={classes.searchContiner}>
        <OverflowSet
          aria-label="Search options"
          items={searchOptions.map((option) => ({
            key: option.key,
            name: option.name,
            onClick: () => {
              setSearchQuery(() => option.searchQuery);
              setSelected(option.name);
            },
            className:
              selected == option.name
                ? classes.selectedSearchOption
                : classes.notSelectedSearchOption
          }))}
          onRenderItem={onRenderItem}
        />
        <SearchText
          {...searchConfig}
          getSuggestions={searchQuery}
          onSelectItem={(id: number | string | undefined) => {
            navigate(
              "/search/" + selected.toLowerCase() + "/" + id + "/attractions"
            );
          }}
        />
      </Stack>
    </>
  );
};

export default Home;
