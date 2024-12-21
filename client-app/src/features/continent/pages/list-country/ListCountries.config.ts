import { IDetailsRowProps } from "@fluentui/react";
import { ListHeaderProps } from "../../../../shared/list-element/ui/list-header/ListHeader.types";

export const onRenderWhenNoMoreItems = (
  _index?: number,
  _rowProps?: IDetailsRowProps
): React.ReactNode => {
  return null;
};

export const listHeader: ListHeaderProps = {
  text: "All countries",
  showSearchBar: false
};
