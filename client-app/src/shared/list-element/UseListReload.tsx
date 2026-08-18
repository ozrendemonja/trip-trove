import React from "react";

export interface ListReloadController {
  reloadData: boolean;
  loadMore: () => void;
  reload: () => void;
}

export const useListReload = (reset?: () => void): ListReloadController => {
  const [reloadData, loadMore] = React.useReducer((value) => !value, true);

  const reload = (): void => {
    reset?.();
    loadMore();
  };

  return { reloadData, loadMore, reload };
};
