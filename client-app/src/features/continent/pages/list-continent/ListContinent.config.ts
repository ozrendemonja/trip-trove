import { IDetailsRowProps } from "@fluentui/react";
import { ListHeaderProps } from "../../../../shared/list-element/ui/list-header/ListHeader.types";

export const onRenderWhenNoMoreItems = (
  _index?: number,
  _rowProps?: IDetailsRowProps
): React.ReactNode => {
  return null;
};

const onSearchKeyStroke = (
  _event?: React.ChangeEvent<HTMLInputElement>,
  _text?: string
): void => {
  // this.setState({
  //     sortedItems: text ? this._allItems.filter(i => i.color.toLowerCase().indexOf(text) > -1) : this._allItems,
  // });
};

export const listHeader: ListHeaderProps = {
  text: "All continents",
  onSearchTyped: onSearchKeyStroke
};
