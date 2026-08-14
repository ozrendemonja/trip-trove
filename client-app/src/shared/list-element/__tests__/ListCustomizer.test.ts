import { ListCustomizer, ListCustomizerConfiguration } from "../ListCustomizer";

interface Row {
  id: number;
}

class InfiniteScrollConfiguration extends ListCustomizerConfiguration<Row> {
  public constructor() {
    super(true);
  }

  public createColumns(): [] {
    return [];
  }
}

const createCustomizer = (
  notifyItemsChanged: (items: Row[]) => void,
  items: Row[] = []
): ListCustomizer<Row> =>
  new ListCustomizer(
    notifyItemsChanged,
    () => {},
    new InfiniteScrollConfiguration(),
    items
  );

test("paged rows share one infinite-scroll sentinel", () => {
  const notifyItemsChanged = jest.fn<(items: Row[]) => void>();
  let customizer = createCustomizer(notifyItemsChanged);

  customizer = customizer.withPagedRows([{ id: 1 }]);
  customizer.withPagedRows([{ id: 2 }]);

  expect(notifyItemsChanged).toHaveBeenLastCalledWith([
    { id: 1 },
    { id: 2 },
    null
  ]);
});

test("repeated empty pages preserve the last real row", () => {
  const notifyItemsChanged = jest.fn<(items: Row[]) => void>();
  let customizer = createCustomizer(notifyItemsChanged);

  customizer = customizer.withPagedRows([{ id: 1 }]);
  customizer = customizer.withPagedRows([]);
  customizer.withPagedRows([]);

  expect(notifyItemsChanged).toHaveBeenLastCalledWith([{ id: 1 }]);
});
