import { IDetailsRowProps } from "@fluentui/react";
import { ListHeaderProps } from "../../../shared/ListElement/ui/ListHeader/ListHeader.types";

export const onRenderWhenNoMoreItems = (
  index?: number,
  rowProps?: IDetailsRowProps
) => {
  return null;
};

export const listHeader: ListHeaderProps = {
  text: "All continents",
  showSearchBar: false
};
