import { deleteRegionWithId } from "../infra/ManagerApi";
import { RegionRow } from "../pages/list-region/ListRegion.types";

export const deleteRows = async (regions: RegionRow[]): Promise<void> => {
  for (const region of regions) {
    await deleteRegionWithId(region.id);
  }
};
