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

export const Home: React.FunctionComponent = () => {
  const classes = useClasses();

  const [searchQuery, setSearchQuery] = useState(() => searchContinent);
  const navigate = useNavigate();

  const continent = "Continent";
  const country = "Country";
  const region = "Region";
  const city = "City";
  const mainAttraction = "Main attraction";
  const [selected, setSelected] = useState<string>(continent);

  return (
    <>
      <Navigation />
      <Stack
        tokens={{ childrenGap: 0 }}
        styles={{ root: { position: "absolute", left: "50%" } }}
      >
        <OverflowSet
          aria-label="Search options"
          items={[
            {
              key: "continent-search",
              name: continent,
              onClick: () => {
                setSearchQuery(() => searchContinent);
                setSelected(continent);
              },
              className:
                selected == continent
                  ? classes.selectedSearchOption
                  : classes.notSelectedSearchOption
            },
            {
              key: "country-search",
              name: country,
              onClick: () => {
                setSearchQuery(() => searchCountry);
                setSelected(country);
              },
              className:
                selected == country
                  ? classes.selectedSearchOption
                  : classes.notSelectedSearchOption
            },
            {
              key: "region-search",
              name: region,
              onClick: () => {
                setSearchQuery(() => searchRegion);
                setSelected(region);
              },
              className:
                selected == region
                  ? classes.selectedSearchOption
                  : classes.notSelectedSearchOption
            },
            {
              key: "city-search",
              name: city,
              onClick: () => {
                setSearchQuery(() => searchCity);
                setSelected(city);
              },
              className:
                selected == city
                  ? classes.selectedSearchOption
                  : classes.notSelectedSearchOption
            },
            {
              key: "main-attraction-search",
              name: mainAttraction,
              onClick: () => {
                setSearchQuery(() => searchMainAttraction);
                setSelected(mainAttraction);
              },
              className:
                selected == mainAttraction
                  ? classes.selectedSearchOption
                  : classes.notSelectedSearchOption
            }
          ]}
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
