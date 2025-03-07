import {
  IColumn,
  Icon,
  initializeIcons,
  Link,
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
import { Attraction, LastReadAttraction } from "../../domain/Attraction.types";
import { AttractionListCustomizerUser } from "../../domain/AttractionListCustomizerUser";
import {
  getPagedAttractionsByCityId,
  getPagedAttractionsByContinentName,
  getPagedAttractionsByCountryId,
  getPagedAttractionsByMainAttractionId,
  getPagedAttractionsByRegionId
} from "../../infra/ManagerApi";
import { onRenderWhenNoMoreItems } from "../list-attraction/ListAttraction.config";
import { useClasses } from "../list-attraction/ListAttraction.styles";
import { AttractionRow } from "../list-attraction/ListAttraction.types";
import { toLastReadAttraction } from "../list-attraction/ListAttraction.util";

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
  const { whereToSearch, id } = useParams();

  // Add query
  //   searchParams.get("__firebase_request_key")
  searchParams.forEach((i) => console.log(i));

  // Repeated
  const continent = "continent";
  const country = "country";
  const region = "region";
  const city = "city";
  const getPagedAttractions = async (
    id: string | number,
    lastReadAttraction?: LastReadAttraction
  ): Promise<Attraction[]> => {
    if (whereToSearch == continent) {
      return getPagedAttractionsByContinentName(
        id as string,
        lastReadAttraction
      );
    }
    if (whereToSearch == country) {
      return getPagedAttractionsByCountryId(id as number, lastReadAttraction);
    }
    if (whereToSearch == region) {
      return getPagedAttractionsByRegionId(id as number, lastReadAttraction);
    }
    if (whereToSearch == city) {
      return getPagedAttractionsByCityId(id as number, lastReadAttraction);
    }
    return getPagedAttractionsByMainAttractionId(
      id as number,
      lastReadAttraction
    );
  };

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

  useEffect(() => {
    getPagedAttractions(id, lastElement).then((data) => {
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
            <Text styles={{ root: { fontSize: 30 } }}>Paris,</Text>
            <Text styles={{ root: { fontSize: 30, color: "gray" } }}>
              France
            </Text>
          </Stack>
          <ListElementUser
            items={items}
            columns={columns}
            listHeader={{
              text: "Attractions"
            }}
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
