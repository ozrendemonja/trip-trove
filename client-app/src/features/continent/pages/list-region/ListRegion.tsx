import {
  IColumn,
  IDropdownOption,
  Link,
  Selection,
  Stack,
  Text
} from "@fluentui/react";
import { useBoolean } from "@fluentui/react-hooks";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import ListElement from "../../../../shared/list-element/ListElement";
import { LoadingSpinner } from "../../../../shared/loading-spinner/LoadingSpinner";
import Navigation from "../../../../shared/navigation/Navigation";
import { OrderOptions } from "../../domain/Continent.types";
import { deleteRows } from "../../domain/Region";
import { LastReadRegion, Region } from "../../domain/Region.types";
import { RegionListCustomizer } from "../../domain/RegionListCustomizer";
import { getRegions } from "../../infra/ManagerApi";
import EditPropertyRegionDetails from "./EditPropertyRegionDetails";
import EditRegionCountryDetails from "./EditRegionCountryDetails";
import { listHeader, onRenderWhenNoMoreItems } from "./ListRegion.config";
import { useClasses } from "./ListRegion.styles";
import { RegionRow } from "./ListRegion.types";
import { toLastReadRegion } from "./ListRegion.utils";

const onRenderItemColumn = (
  className: string,
  onUpdateClick: () => void,
  region?: RegionRow,
  column?: IColumn
): JSX.Element | string | number => {
  if (column?.key === "skipElement") {
    return <></>;
  }
  if (column?.key === "name") {
    return (
      <Stack tokens={{ childrenGap: 15 }} horizontal={true}>
        <Link
          className={className}
          href={`https://www.google.com/search?q=${region?.name}`}
          target="_blank"
          rel="noopener"
          underline
        >
          {region?.name}
        </Link>
        <EditPropertyRegionDetails
          regionId={region!.id}
          text={region!.name}
          onUpdateClick={onUpdateClick}
        />
      </Stack>
    );
  } else if (column?.key === "country") {
    return (
      <Stack tokens={{ childrenGap: 15 }} horizontal={true}>
        <Text>{region?.country}</Text>
        <EditRegionCountryDetails
          regionId={region!.id}
          text={region!.country}
          onUpdateClick={onUpdateClick}
        />
      </Stack>
    );
  }
  return region[column.fieldName as keyof Region] as string;
};

const sortOptions: IDropdownOption[] = [
  { key: "DESC" as OrderOptions, text: "Newest", selected: true },
  { key: "ASC" as OrderOptions, text: "Oldest" }
];

export const RegionList: React.FunctionComponent = () => {
  const classes = useClasses();

  const [items, setItems] = useState<RegionRow[]>([]);
  const [columns, setColumns] = useState<IColumn[]>([]);
  const [isLoading, { setTrue: setLoading, setFalse: setNotLoading }] =
    useBoolean(true);
  const [reloadData, { toggle: toggleReloadData }] = useBoolean(true);
  const [order, setOrder] = useState<OrderOptions>("DESC");
  const [lastElement, setLastElement] = useState<LastReadRegion | undefined>(
    undefined
  );
  const navigate = useNavigate();
  const [regionCustomizer, setRegionCustomizer] = useState(
    new RegionListCustomizer(setItems, setColumns)
  );

  useEffect(() => {
    getRegions(lastElement, order).then((data) => {
      setLoading();
      setLastElement(toLastReadRegion(data));
      const regionRows = data.map(RegionRow.from);
      setRegionCustomizer(regionCustomizer.withPagedRows(regionRows));
      regionCustomizer.createColumns();
      setNotLoading();
    });
  }, [reloadData]);

  const [query, setQuery] = useState("");
  //   const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  //   useEffect(() => {
  //     if (query.trim().length >= 3) {
  //       searchCountry(query).then((data) => {
  //         setSuggestions(data);
  //       });
  //     }
  //   }, [query]);

  return (
    <>
      <Navigation />
      {isLoading && <LoadingSpinner text="Updating list of regions" />}
      {!isLoading && (
        <ListElement
          items={items}
          columns={columns}
          listHeader={{
            ...listHeader,
            onSortOptionChange: (
              _event: React.FormEvent<HTMLDivElement>,
              option?: IDropdownOption,
              _index?: number
            ) => {
              setOrder(option!.key as OrderOptions);
              setRegionCustomizer(
                new RegionListCustomizer(setItems, setColumns)
              );
              toggleReloadData();
            },
            sortOptions: sortOptions,
            // items: suggestions,
            onSearchTyped: (
              _event?: React.ChangeEvent<HTMLInputElement>,
              newValue?: string
            ) => {
              setQuery(newValue ?? "");
            }
            // onFindItem: (id: number) => {
            //   getCountryById(id).then((data) => {
            //     setCountryCustomizer(() => {
            //       return new CountryListCustomizer(
            //         setItems,
            //         setColumns
            //       ).withFixedRows([CountryRow.from(data)]);
            //     });
            //     setSuggestions([]);
            //   });
            // }
          }}
          addRowOptions={{
            text: "Add new region",
            onAddRow: () => navigate("/add-region")
          }}
          deleteRowOptions={{
            text: "Delete region",
            onDeleteRow: async (selection: Selection<RegionRow>) => {
              await deleteRows(selection.getSelection());
              setRegionCustomizer(
                new RegionListCustomizer(setItems, setColumns)
              );
              toggleReloadData();
            }
          }}
          onRenderMissingItem={(_index: number) =>
            onRenderWhenNoMoreItems(toggleReloadData)
          }
          onRenderItemColumn={(
            item?: RegionRow,
            _index?: number,
            column?: IColumn
          ) =>
            onRenderItemColumn(
              classes.linkField,
              () => {
                setRegionCustomizer(
                  new RegionListCustomizer(setItems, setColumns)
                );
                toggleReloadData();
              },
              item,
              column
            )
          }
          selectedItemName={(selection: Selection<Region>) => {
            if (
              selection &&
              selection.getSelection() &&
              selection.getSelection().length > 0
            ) {
              return selection.getSelection()[0].name;
            }
          }}
        />
      )}
    </>
  );
};

export default RegionList;
