import {
  Button,
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHeaderCell,
  TableRow,
  tokens
} from "@fluentui/react-components";
import { useVirtualizer } from "@tanstack/react-virtual";
import React, { CSSProperties, ReactElement, ReactNode } from "react";

export interface DataColumn {
  id: string;
  header: string;
  accessor?: string;
  headerAriaLabel?: string;
  minWidth?: number;
  maxWidth?: number;
  multiline?: boolean;
  sorted?: boolean;
  sortDescending?: boolean;
  onHeaderClick?: (
    event: React.MouseEvent<HTMLElement>,
    column: DataColumn
  ) => void;
  renderHeader?: () => ReactNode;
}

export const createDataColumns = <T extends object>(
  rows: Array<T | null | undefined>,
  onHeaderClick?: (
    event: React.MouseEvent<HTMLElement>,
    column: DataColumn
  ) => void
): DataColumn[] => {
  const sample = rows.find((row): row is T => !!row);
  if (!sample) return [];

  return Object.keys(sample).map((key) => ({
    id: key,
    header: key,
    accessor: key,
    minWidth: 100,
    onHeaderClick
  }));
};

interface DataSelectionOptions {
  onChange?: () => void;
}

export class DataSelection<T = unknown> {
  private rows: T[] = [];
  private selectedRow: T | undefined;
  private readonly listeners = new Set<() => void>();
  private readonly onChange?: () => void;

  constructor(options: DataSelectionOptions = {}) {
    this.onChange = options.onChange;
  }

  replaceRows(rows: T[] = [], clear = true): void {
    this.rows = rows;
    if (
      clear ||
      (this.selectedRow !== undefined && !rows.includes(this.selectedRow))
    ) {
      this.setSelectedRow(undefined);
    }
  }

  selectIndex(index: number, selected: boolean): void {
    this.setSelectedRow(selected ? this.rows[index] : undefined);
  }

  selectedCount(): number {
    return this.selectedRow === undefined ? 0 : 1;
  }

  selectedRows(): T[] {
    return this.selectedRow === undefined ? [] : [this.selectedRow];
  }

  isSelected(index: number): boolean {
    return (
      this.selectedRow !== undefined && this.rows[index] === this.selectedRow
    );
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private setSelectedRow(row: T | undefined): void {
    if (this.selectedRow === row) return;
    this.selectedRow = row;
    this.onChange?.();
    this.listeners.forEach((listener) => listener());
  }
}

export interface DataTableVirtualizationOptions {
  estimatedRowHeight: number;
  overscan: number;
}

export interface DataTableProps<T> {
  rows?: Array<T | null | undefined>;
  columns?: DataColumn[];
  selection?: DataSelection<T>;
  selectable?: boolean;
  className?: string;
  "aria-label"?: string;
  selectionButtonAriaLabel?: string;
  onLoadMore?: (index: number) => void;
  renderCell?: (row: T, index: number, column: DataColumn) => ReactNode;
  getRowClassName?: (row: T, index: number) => string | undefined;
  virtualization?: DataTableVirtualizationOptions;
  scrollContainerRef?: React.RefObject<HTMLElement | null>;
}

const MissingListItem: React.FC<{
  index: number;
  onLoadMore?: (index: number) => void;
}> = ({ index, onLoadMore }) => {
  const loadMore = React.useEffectEvent((currentIndex: number) => {
    onLoadMore?.(currentIndex);
  });

  React.useEffect(() => {
    loadMore(index);
  }, [index]);

  return null;
};

const COLUMN_ACTION_WIDTH = 40;

const minWidthWithActions = (column: DataColumn): number =>
  (column.minWidth ?? 100) + COLUMN_ACTION_WIDTH;

const columnStyle = (column: DataColumn): CSSProperties => ({
  minWidth: minWidthWithActions(column),
  maxWidth:
    column.maxWidth === undefined
      ? undefined
      : column.maxWidth + COLUMN_ACTION_WIDTH,
  width:
    column.maxWidth !== undefined && column.minWidth === column.maxWidth
      ? column.maxWidth + COLUMN_ACTION_WIDTH
      : undefined,
  whiteSpace: column.multiline === false ? "nowrap" : undefined
});

export const DataTable = <T,>({
  rows = [],
  columns = [],
  selection,
  selectable = false,
  className,
  "aria-label": ariaLabel,
  selectionButtonAriaLabel = "select row",
  onLoadMore,
  renderCell,
  getRowClassName,
  virtualization,
  scrollContainerRef
}: DataTableProps<T>): ReactElement => {
  const [, rerender] = React.useReducer((value) => value + 1, 0);
  const isVirtualized = virtualization !== undefined;
  const rowVirtualizer = useVirtualizer({
    count: isVirtualized ? rows.length : 0,
    getScrollElement: () => scrollContainerRef?.current ?? null,
    estimateSize: () => virtualization?.estimatedRowHeight ?? 0,
    overscan: virtualization?.overscan ?? 0
  });

  React.useLayoutEffect(() => {
    const selectedRows = selection?.selectedRows() ?? [];
    const selectedRow = selectedRows.length > 0 ? selectedRows[0] : undefined;
    const normalizedRows = rows.filter((row): row is T => row != null);
    const hasSelectedRow =
      selectedRow === undefined || normalizedRows.includes(selectedRow);

    selection?.replaceRows(
      rows.filter((row): row is T => row != null),
      !hasSelectedRow
    );
    return selection?.subscribe(rerender);
  }, [rows, selection]);

  const isSelectable = selectable && !!selection;

  const selectRow = (index: number): void => {
    if (!selection || !rows[index]) return;
    selection.selectIndex(index, !selection.isSelected(index));
  };

  const virtualItems = isVirtualized ? rowVirtualizer.getVirtualItems() : [];
  const rowIndexes = isVirtualized
    ? virtualItems.length > 0
      ? virtualItems.map((item) => item.index)
      : rows.slice(0, 5).map((_row, index) => index)
    : rows.map((_row, index) => index);
  const paddingTop = virtualItems[0]?.start ?? 0;
  const paddingBottom =
    virtualItems.length > 0
      ? Math.max(
          0,
          rowVirtualizer.getTotalSize() -
            virtualItems[virtualItems.length - 1].end
        )
      : 0;
  const columnCount = columns.length + (isSelectable ? 1 : 0);

  return (
    <Table
      role="grid"
      aria-label={ariaLabel}
      aria-busy={rows.some((row) => !row)}
      className={className}
      data-automationid="DataGrid"
      style={{
        minWidth: columns.reduce(
          (width, column) => width + minWidthWithActions(column),
          isSelectable ? 44 : 0
        )
      }}
    >
      <TableHeader>
        <TableRow>
          {isSelectable && (
            <TableHeaderCell
              style={{
                width: 44,
                minWidth: 44,
                position: "sticky",
                left: 0,
                zIndex: 2,
                backgroundColor: "var(--colorNeutralBackground1)"
              }}
            />
          )}
          {columns.map((column) => (
            <TableHeaderCell key={column.id} style={columnStyle(column)}>
              {column.renderHeader ? (
                column.renderHeader()
              ) : column.onHeaderClick ? (
                <Button
                  appearance="subtle"
                  aria-label={column.headerAriaLabel ?? column.header}
                  onClick={(event) => column.onHeaderClick?.(event, column)}
                >
                  {column.header}
                  {column.sorted ? (column.sortDescending ? " ↓" : " ↑") : null}
                </Button>
              ) : (
                column.header
              )}
            </TableHeaderCell>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {paddingTop > 0 && (
          <tr aria-hidden="true" style={{ height: paddingTop }}>
            <td
              colSpan={columnCount}
              style={{ height: paddingTop, padding: 0, border: 0 }}
            />
          </tr>
        )}
        {rowIndexes.map((index) => {
          const row = rows[index];
          if (!row) {
            return (
              <MissingListItem
                key={`missing-${index}`}
                index={index}
                onLoadMore={onLoadMore}
              />
            );
          }

          const selected = selection?.isSelected(index) ?? false;

          return (
            <TableRow
              key={index}
              ref={
                isVirtualized
                  ? (element) => rowVirtualizer.measureElement(element)
                  : undefined
              }
              data-index={isVirtualized ? index : undefined}
              role="row"
              aria-rowindex={isVirtualized ? index + 2 : undefined}
              aria-selected={selected}
              appearance={selected ? "brand" : "none"}
              className={getRowClassName?.(row, index)}
              onClickCapture={(event) => {
                const target = event.target as HTMLElement;
                if (target.closest("button, a, input, select, textarea"))
                  return;
                selectRow(index);
              }}
            >
              {isSelectable && (
                <TableCell
                  role="gridcell"
                  style={{
                    width: 44,
                    minWidth: 44,
                    position: "sticky",
                    left: 0,
                    zIndex: 1,
                    backgroundColor: selected
                      ? "var(--colorBrandBackground2)"
                      : "var(--colorNeutralBackground1)"
                  }}
                >
                  <Button
                    appearance="subtle"
                    shape="circular"
                    size="small"
                    role="radio"
                    aria-label={selectionButtonAriaLabel}
                    aria-checked={selected}
                    onClick={() => selection?.selectIndex(index, true)}
                    icon={
                      <span
                        aria-hidden="true"
                        style={{
                          width: 14,
                          height: 14,
                          color: selected
                            ? tokens.colorCompoundBrandBackground
                            : undefined,
                          borderRadius: tokens.borderRadiusCircular,
                          border: `${tokens.strokeWidthThin} solid currentColor`,
                          boxShadow: selected
                            ? "inset 0 0 0 3px var(--colorNeutralBackground1)"
                            : undefined,
                          backgroundColor: selected
                            ? "currentColor"
                            : tokens.colorTransparentBackground
                        }}
                      />
                    }
                    style={{
                      width: 24,
                      minWidth: 24,
                      height: 24,
                      padding: 0
                    }}
                  />
                </TableCell>
              )}
              {columns.map((column) => (
                <TableCell
                  role="gridcell"
                  key={column.id}
                  style={columnStyle(column)}
                >
                  {renderCell?.(row, index, column) ??
                    String(
                      (row as Record<string, unknown>)[
                        column.accessor ?? column.id
                      ] ?? ""
                    )}
                </TableCell>
              ))}
            </TableRow>
          );
        })}
        {paddingBottom > 0 && (
          <tr aria-hidden="true" style={{ height: paddingBottom }}>
            <td
              colSpan={columnCount}
              style={{ height: paddingBottom, padding: 0, border: 0 }}
            />
          </tr>
        )}
      </TableBody>
    </Table>
  );
};
