import { ListHeaderProps } from "../../../../shared/list-element/ui/list-header/ListHeader.types";

export const onRenderWhenNoMoreItems = (
  triggerDataFetching: () => void
): React.ReactNode => {
  triggerDataFetching();
  return null;
};

export const listHeader: ListHeaderProps = {
  text: "All countries",
  showSearchBar: false
};
