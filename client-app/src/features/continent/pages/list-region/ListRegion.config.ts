import { ListHeaderProps } from "../../../../shared/list-element/ui/list-header/ListHeader.types";

export const onRenderWhenNoMoreItems = (
  triggerDataFetching: () => void
): React.ReactNode => {
  triggerDataFetching();
  return null;
};

export const listHeader: Partial<ListHeaderProps> = {
  text: "All regions",
  showSearchBar: true
};
