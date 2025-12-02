import {
  IOverflowSetItemProps,
  Link,
  OverflowSet,
  Stack
} from "@fluentui/react";
import {
  searchCity,
  searchCountry,
  searchMainAttraction,
  searchRegion
} from "../continent/infra/ManagerApi";
import { SearchTextProps } from "../../shared/search-text/SearchText.types";
import EditProperty from "../../shared/list-element/ui/edit-property/EditProperty";
import { useClasses } from "./MyTrip.styles";
import { useState } from "react";
import { SearchText } from "../../shared/search-text/SearchText";

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
const searchOptions = [
  { key: "country-search", name: country, searchQuery: searchCountry },
  { key: "region-search", name: region, searchQuery: searchRegion },
  { key: "city-search", name: city, searchQuery: searchCity },
  {
    key: "main-attraction-search",
    name: mainAttraction,
    searchQuery: searchMainAttraction
  }
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
      editIconName={"Search"}
      text={props.text}
      onUpdateClick={async () => {
        props.onUpdateClick({ whereToSearch: selected, id: selectedId ?? -1 });
      }}
      isFormValid={selectedId != undefined}
    >
      <Stack tokens={{ childrenGap: 0 }}>
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
            setSelectedId(Number(id));
          }}
        />
      </Stack>
    </EditProperty>
  );
};

export default SearchAttractionsModal;
