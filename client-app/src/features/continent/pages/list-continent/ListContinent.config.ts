import { ListHeaderProps } from "../../../../shared/list-element/ui/list-header/ListHeader.types";

export const onRenderWhenNoMoreItems = (_index: number): React.ReactNode => {
  return null;
};

export const listHeader: Partial<ListHeaderProps> = {
  text: "All continents",
  showSearchBar: true
};
