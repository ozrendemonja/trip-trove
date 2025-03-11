import {
  IColumn,
  Icon,
  initializeIcons,
  Link,
  SearchBox,
  Stack,
  Text
} from "@fluentui/react";
import { useBoolean } from "@fluentui/react-hooks";
import React, { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router";
import { ListElementUser } from "../../../../shared/list-element/ListElementUser";
import DateRangePicker from "../../../../shared/list-element/ui/date-picker/DateRangePicker";
import { LoadingSpinner } from "../../../../shared/loading-spinner/LoadingSpinner";
import Navigation from "../../../../shared/navigation/Navigation";
import { LastReadAttraction } from "../../domain/Attraction.types";
import { AttractionListCustomizerUser } from "../../domain/AttractionListCustomizerUser";
import { onRenderWhenNoMoreItems } from "../list-attraction/ListAttraction.config";
import {
  AttractionRow,
  ListAttractionPageInfo
} from "../list-attraction/ListAttraction.types";
import { toLastReadAttraction } from "../list-attraction/ListAttraction.util";
import { useClasses } from "./ListAttractionUser.styles";
import {
  createGetPagedAttractions,
  createGetPageInfoById,
  stringToBoolean,
  toggleQueryParam
} from "./ListAttractionUser.utils";
import { Filter } from "./ui/Filter";

initializeIcons();

const onRenderItemColumn = (
  className: string,
  onUpdateClick: () => void,
  atraction?: AttractionRow,
  column?: IColumn
): JSX.Element | string | number => {
  if (column?.key === "name") {
    return (
      <Stack horizontal>
        <Link
          className={className}
          href={`https://www.google.com/search?q=${atraction?.name.name}`}
          target="_blank"
          rel="noopener"
          underline
        >
          <div>{atraction?.name.name}</div>
          {atraction?.name.mainAttractionName && (
            <div>(part of {atraction?.name.mainAttractionName})</div>
          )}
        </Link>
        {atraction?.mustVisit && <Icon iconName="Pinned" />}
        {atraction?.isTraditional && <Icon iconName="Cotton" />}
      </Stack>
    );
  } else if (column?.key === "destination") {
    return (
      <Text>
        {(atraction?.destination.cityName
          ? atraction?.destination.cityName + ", "
          : "") +
          atraction?.destination.regionName +
          ", " +
          atraction?.destination.countryName}
      </Text>
    );
  } else if (column?.key === "address") {
    return (
      <Text>
        {atraction?.address.streetAddress && (
          <div>{atraction?.address.streetAddress}</div>
        )}
        {atraction?.address.location && (
          <div>
            (
            {atraction?.address.location.latitude +
              " " +
              atraction?.address.location.longitude}
            )
          </div>
        )}
      </Text>
    );
  } else if (column?.key === "infoFrom") {
    return (
      <>
        <div>{atraction?.infoFrom.source}</div>
        <div>({atraction?.infoFrom.recorded})</div>
      </>
    );
  } else if (column?.key === "optimalVisitPeriod") {
    return (
      <Stack>
        {atraction?.optimalVisitPeriod && <DateRangePicker></DateRangePicker>}
      </Stack>
    );
  } else if (column?.key === "tip") {
    return <Text>{atraction?.tip}</Text>;
  } else if (column?.key === "category") {
    return (
      <Stack horizontal>
        <Text>{atraction?.category}</Text>
        {atraction?.needsBellIcon() && (
          <Icon
            iconName="Ringer"
            styles={{
              root: { colour: atraction?.willChangeSoon() ? "red" : "yellow" }
            }}
          />
        )}
      </Stack>
    );
  }

  return atraction[column?.fieldName as keyof AttractionRow] as string;
};

export const AttractionListUser: React.FunctionComponent = () => {
  const classes = useClasses();

  const [searchParams, setSearchParams] = useSearchParams();
  const [items, setItems] = useState<AttractionRow[]>([]);
  const [columns, setColumns] = useState<IColumn[]>([]);
  const [isLoading, { setTrue: setLoading, setFalse: setNotLoading }] =
    useBoolean(true);
  const [reloadData, { toggle: toggleReloadData }] = useBoolean(true);
  const [lastElement, setLastElement] = useState<
    LastReadAttraction | undefined
  >(undefined);
  const [attractionCustomizer, setAttractionCustomizer] = useState(
    new AttractionListCustomizerUser(setItems, setColumns)
  );

  const { whereToSearch, id } = useParams();
  const getPagedAttractions = (lastAttraction?: LastReadAttraction) =>
    createGetPagedAttractions(whereToSearch)(id, lastAttraction, {
      category: searchParams.get("category") ?? undefined,
      isCountrywide: stringToBoolean(searchParams.get("isCountrywide")),
      isTraditional: stringToBoolean(searchParams.get("isTraditional")),
      mustVisit: stringToBoolean(searchParams.get("mustVisit")),
      q: searchParams.get("q"),
      type: searchParams.get("type") ?? undefined
    });

  const [pageInfo, setPageInfo] = useState<ListAttractionPageInfo>({
    name: "",
    under: ""
  });
  useEffect(() => {
    createGetPageInfoById(whereToSearch)(id!).then(setPageInfo);
  }, []);

  useEffect(() => {
    getPagedAttractions(lastElement).then((data) => {
      setLoading();
      setLastElement(toLastReadAttraction(data));
      const attractionRows = data.map(AttractionRow.from);
      setAttractionCustomizer(
        attractionCustomizer.withPagedRows(attractionRows)
      );
      attractionCustomizer.createColumns();
      setNotLoading();
    });
  }, [reloadData]);

  const createFilter = (param: string) => ({
    has: (value: string) =>
      searchParams.has(param) && searchParams.get(param) === value,
    onClick: (filterValue: string) => {
      toggleQueryParam(param, filterValue, searchParams, setSearchParams);
      setAttractionCustomizer(
        new AttractionListCustomizerUser(setItems, setColumns)
      );
      toggleReloadData();
    }
  });

  return (
    <>
      <Navigation />
      {isLoading && <LoadingSpinner text="Updating list of attractions" />}
      {!isLoading && (
        <>
          <Stack
            horizontal
            styles={{ root: { fontSize: 30, marginBottom: 46 } }}
          >
            <Icon iconName="MapPin" />
            <Text styles={{ root: { fontSize: 30 } }}>{pageInfo.name}</Text>
            <Text styles={{ root: { fontSize: 30, color: "gray" } }}>
              {pageInfo.under && `, ${pageInfo.under}`}
            </Text>
          </Stack>
          <Stack horizontal className={classes.root}>
            <Text as="h1">Attractions</Text>
            <SearchBox
              placeholder="Search for name, source or tip"
              value={searchParams.get("q") ?? undefined}
              onSearch={(newValue) => {
                createFilter("q").onClick(newValue);
              }}
              onClear={() => {
                const filter = createFilter("q");
                searchParams.has("q") && filter.onClick(searchParams.get("q")!);
              }}
            />
            <Filter
              countrywide={createFilter("isCountrywide")}
              mustVisit={createFilter("mustVisit")}
              traditional={createFilter("isTraditional")}
              category={createFilter("category")}
              type={createFilter("type")}
            ></Filter>
          </Stack>
          <ListElementUser
            items={items}
            columns={columns}
            onRenderMissingItem={(_index: number | undefined) =>
              onRenderWhenNoMoreItems(toggleReloadData)
            }
            onRenderItemColumn={(
              item?: AttractionRow,
              _index?: number,
              column?: IColumn
            ) =>
              onRenderItemColumn(
                classes.linkField,
                () => {
                  setAttractionCustomizer(
                    new AttractionListCustomizerUser(setItems, setColumns)
                  );
                  toggleReloadData();
                },
                item,
                column
              )
            }
          />
        </>
      )}
    </>
  );
};

export default AttractionListUser;
