import {
  DataColumn,
  DataSelection
} from "../../../../shared/ui/data-table/DataTable";
import { SelectChoice } from "../../../../shared/ui/forms/SelectField";
import { Link, Text } from "@fluentui/react-components";
import { useBooleanState } from "../../../../shared/hooks/useBooleanState";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import ListElement from "../../../../shared/list-element/ListElement";
import { ListCustomizer } from "../../../../shared/list-element/ListCustomizer";
import { useListPageClasses } from "../../../../shared/list-element/ListPage.styles";
import { LoadingSpinner } from "../../../../shared/loading-spinner/LoadingSpinner";
import Navigation from "../../../../shared/navigation/Navigation";
import { OrderOptions } from "../../domain/Continent.types";
import { RegionListCustomizerConfiguration } from "../../domain/ListCustomizerConfigurations";
import { deleteRows } from "../../domain/Region";
import { LastReadRegion, Region } from "../../domain/Region.types";
import {
  getRegionById,
  getRegions,
  searchRegion
} from "../../infra/ManagerApi";
import EditPropertyRegionDetails from "./EditPropertyRegionDetails";
import EditRegionCountryDetails from "./EditRegionCountryDetails";
import { listHeader, onRenderWhenNoMoreItems } from "./ListRegion.config";
import { useClasses } from "./ListRegion.styles";
import { RegionRow } from "./ListRegion.types";
import { toLastReadRegion } from "./ListRegion.utils";
import { Suggestion } from "../../domain/Suggestion.types.";
import { Flex } from "../../../../shared/ui/Flex";

const renderCellContent = (
  className: string,
  onUpdateClick: () => void,
  region: RegionRow,
  _index: number,
  column: DataColumn
): JSX.Element | string | number => {
  if (column.id === "name") {
    return (
      <Flex gap={15} direction="row">
        <Link
          data-fluent-link
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
      </Flex>
    );
  } else if (column.id === "country") {
    return (
      <Flex gap={15} direction="row">
        <Text>{region?.country}</Text>
        <EditRegionCountryDetails
          regionId={region!.id}
          text={region!.country}
          onUpdateClick={onUpdateClick}
        />
      </Flex>
    );
  }
  return region[column.accessor as keyof Region] as string;
};

const sortOptions: SelectChoice[] = [
  { value: "DESC" as OrderOptions, label: "Newest" },
  { value: "ASC" as OrderOptions, label: "Oldest" }
];

export const RegionList: React.FunctionComponent = () => {
  const classes = useClasses();
  const pageClasses = useListPageClasses();

  const [items, setItems] = useState<RegionRow[]>([]);
  const [columns, setColumns] = useState<DataColumn[]>([]);
  const [isLoading, { setTrue: setLoading, setFalse: setNotLoading }] =
    useBooleanState(true);
  const [reloadData, { toggle: toggleReloadData }] = useBooleanState(true);
  const [order, setOrder] = useState<OrderOptions>("DESC");
  const [lastElement, setLastElement] = useState<LastReadRegion | undefined>(
    undefined
  );
  const navigate = useNavigate();
  const createRegionCustomizer = (): ListCustomizer<RegionRow> =>
    new ListCustomizer(
      setItems,
      setColumns,
      new RegionListCustomizerConfiguration()
    );
  const [regionCustomizer, setRegionCustomizer] = useState(
    createRegionCustomizer
  );
  const resetRegionPagination = (): void => {
    setRegionCustomizer(createRegionCustomizer());
    setLastElement(undefined);
  };

  useEffect(() => {
    getRegions(lastElement, order).then((data) => {
      setLoading();
      setLastElement(toLastReadRegion(data));
      const regionRows = data.map(RegionRow.from);
      const nextCustomizer = regionCustomizer.withPagedRows(regionRows);
      nextCustomizer.createColumns();
      setRegionCustomizer(nextCustomizer);
      setNotLoading();
    });
  }, [reloadData]);

  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  useEffect(() => {
    if (query.trim().length >= 3) {
      searchRegion(query).then(setSuggestions);
    }
  }, [query]);

  return (
    <div className={pageClasses.pageLayout}>
      <Navigation />
      <main className={pageClasses.content}>
        {isLoading && <LoadingSpinner text="Updating list of regions" />}
        {!isLoading && (
          <ListElement
            items={items}
            columns={columns}
            listHeader={{
              ...listHeader,
              setItems: setSuggestions,
              onSortOptionChange: (_event, choice) => {
                setOrder(choice!.value as OrderOptions);
                resetRegionPagination();
                toggleReloadData();
              },
              sortOptions: sortOptions,
              selectedSortValue: order,
              items: suggestions,
              onSearchTyped: (
                _event?: React.ChangeEvent<HTMLInputElement>,
                newValue?: string
              ) => {
                setQuery(newValue ?? "");
              },
              onFindItem: (id) => {
                if (typeof id !== "number") return;
                getRegionById(id).then((data) => {
                  setRegionCustomizer(() => {
                    return createRegionCustomizer().withFixedRows([
                      RegionRow.from(data)
                    ]);
                  });
                  setSuggestions([]);
                });
              }
            }}
            addRowOptions={{
              text: "Add new region",
              onAddRow: () => navigate("/add-region")
            }}
            deleteRowOptions={{
              text: "Delete region",
              onDeleteRow: async (selection: DataSelection<RegionRow>) => {
                await deleteRows(selection.selectedRows());
                resetRegionPagination();
                toggleReloadData();
              }
            }}
            onLoadMore={(_index: number) =>
              onRenderWhenNoMoreItems(toggleReloadData)
            }
            renderCell={(item: RegionRow, index: number, column: DataColumn) =>
              renderCellContent(
                classes.linkField,
                () => {
                  resetRegionPagination();
                  toggleReloadData();
                },
                item,
                index,
                column
              )
            }
            getSelectedItemName={(selection: DataSelection<Region>) => {
              const selectedRows = selection.selectedRows();
              if (selectedRows.length > 0) {
                return selectedRows[0].name;
              }

              return "";
            }}
          />
        )}
      </main>
    </div>
  );
};

export default RegionList;
