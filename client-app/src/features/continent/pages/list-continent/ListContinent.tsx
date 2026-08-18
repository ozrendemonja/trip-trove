import {
  DataColumn,
  DataSelection
} from "../../../../shared/ui/data-table/DataTable";
import { SelectChoice } from "../../../../shared/ui/forms/SelectField";
import { Link } from "@fluentui/react-components";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import ListElement from "../../../../shared/list-element/ListElement";
import { ListCustomizer } from "../../../../shared/list-element/ListCustomizer";
import { useListPageClasses } from "../../../../shared/list-element/ListPage.styles";
import { useListReload } from "../../../../shared/list-element/UseListReload";
import EditContinentDetails from "./EditContinentDetails";
import { LoadingSpinner } from "../../../../shared/loading-spinner/LoadingSpinner";
import Navigation from "../../../../shared/navigation/Navigation";
import { deleteRows } from "../../domain/Continent";
import { Continent, OrderOptions } from "../../domain/Continent.types";
import { ContinentListCustomizerConfiguration } from "../../domain/ListCustomizerConfigurations";
import { Suggestion } from "../../domain/Suggestion.types.";
import { getContinents, searchContinent } from "../../infra/ManagerApi";
import { listHeader, onRenderWhenNoMoreItems } from "./ListContinent.config";
import { useClasses } from "./ListContinent.styles";
import { Flex } from "../../../../shared/ui/Flex";

const renderCellContent = (
  className: string,
  onUpdateClick: () => void,
  continent: Continent,
  _index: number,
  column: DataColumn
): JSX.Element | string | number => {
  if (column.id === "name") {
    return (
      <Flex gap={15} direction="row">
        <Link
          data-fluent-link
          className={className}
          href={`https://www.google.com/search?q=${continent.name}`}
          target="_blank"
          rel="noopener"
          underline
        >
          {continent?.name}
        </Link>
        <EditContinentDetails
          text={continent!.name}
          onUpdateClick={onUpdateClick}
        />
      </Flex>
    );
  }
  return continent[column.accessor as keyof Continent];
};

const sortOptions: SelectChoice[] = [
  { value: "DESC" as OrderOptions, label: "Newest" },
  { value: "ASC" as OrderOptions, label: "Oldest" }
];

export const ContinentList: React.FunctionComponent = () => {
  const classes = useClasses();
  const pageClasses = useListPageClasses();

  const [items, setItems] = useState<Continent[]>([]);
  const [columns, setColumns] = useState<DataColumn[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { reloadData, reload: reloadContinents } = useListReload();
  const [order, setOrder] = useState<OrderOptions>("ASC");
  const navigate = useNavigate();

  useEffect(() => {
    getContinents(order).then((data) => {
      setIsLoading(true);
      const customizer = new ListCustomizer(
        setItems,
        setColumns,
        new ContinentListCustomizerConfiguration()
      ).withFixedRows(data);
      customizer.createColumns();
      setIsLoading(false);
    });
  }, [reloadData]);

  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  useEffect(() => {
    if (query.trim().length >= 3) {
      searchContinent(query).then(setSuggestions);
    }
  }, [query]);

  return (
    <div className={pageClasses.pageLayout}>
      <Navigation />
      <main className={pageClasses.content}>
        {isLoading && <LoadingSpinner text="Updating list of continents" />}
        {!isLoading && (
          <ListElement
            items={items}
            columns={columns}
            listHeader={{
              ...listHeader,
              onSortOptionChange: (_event, choice) => {
                setOrder(choice!.value as OrderOptions);
                reloadContinents();
              },
              sortOptions: sortOptions,
              selectedSortValue: order,
              items: suggestions,
              setItems: setSuggestions,
              onSearchTyped: (_event, newValue) => {
                setQuery(newValue ?? "");
              },
              onFindItem: (id) => {
                if (typeof id !== "string") return;
                const customizer = new ListCustomizer(
                  setItems,
                  setColumns,
                  new ContinentListCustomizerConfiguration()
                ).withFixedRows([{ name: id }]);
                customizer.createColumns();
                setSuggestions([]);
              }
            }}
            addRowOptions={{
              text: "Add new continent",
              onAddRow: () => navigate("/add-continent")
            }}
            deleteRowOptions={{
              text: "Delete continent",
              onDeleteRow: async (selection: DataSelection<Continent>) => {
                await deleteRows(selection.selectedRows());
                reloadContinents();
              }
            }}
            onLoadMore={onRenderWhenNoMoreItems}
            renderCell={(item: Continent, index: number, column: DataColumn) =>
              renderCellContent(
                classes.linkField,
                reloadContinents,
                item,
                index,
                column
              )
            }
            getSelectedItemName={(selection: DataSelection<Continent>) => {
              return selection.selectedRows()[0].name;
            }}
          />
        )}
      </main>
    </div>
  );
};

export default ContinentList;
