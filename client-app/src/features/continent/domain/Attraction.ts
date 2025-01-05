import { deleteAttractionWithId } from "../infra/ManagerApi";
import { AttractionRow } from "../pages/list-attraction/ListAttraction.types";

export const deleteRows = async (
  attractions: AttractionRow[]
): Promise<void> => {
  for (const attraction of attractions) {
    await deleteAttractionWithId(attraction.id);
  }
};
