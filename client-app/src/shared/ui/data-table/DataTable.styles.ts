import { makeStyles, tokens } from "@fluentui/react-components";
import type { CSSProperties } from "react";
import type { DataColumn } from "./DataTable";

const COLUMN_ACTION_WIDTH = 40;
const SELECTION_COLUMN_WIDTH = 44;

const minWidthWithActions = (column: DataColumn): number =>
  (column.minWidth ?? 100) + COLUMN_ACTION_WIDTH;

export const getDataTableStyle = (
  columns: DataColumn[],
  isSelectable: boolean
): CSSProperties => ({
  minWidth: columns.reduce(
    (width, column) => width + minWidthWithActions(column),
    isSelectable ? SELECTION_COLUMN_WIDTH : 0
  )
});

export const getDataColumnStyle = (column: DataColumn): CSSProperties => ({
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

export const getVirtualSpacerStyle = (height: number): CSSProperties => ({
  height
});

export const useDataTableStyles = makeStyles({
  selectionHeaderCell: {
    width: "44px",
    minWidth: "44px",
    position: "sticky",
    left: 0,
    zIndex: 2,
    backgroundColor: tokens.colorNeutralBackground1
  },
  selectionCell: {
    width: "44px",
    minWidth: "44px",
    position: "sticky",
    left: 0,
    zIndex: 1,
    backgroundColor: tokens.colorNeutralBackground1
  },
  selectedSelectionCell: {
    backgroundColor: tokens.colorBrandBackground2
  },
  selectionButton: {
    width: "24px",
    minWidth: "24px",
    height: "24px",
    padding: 0
  },
  selectionIndicator: {
    width: "14px",
    height: "14px",
    borderRadius: tokens.borderRadiusCircular,
    border: `${tokens.strokeWidthThin} solid currentColor`,
    backgroundColor: tokens.colorTransparentBackground
  },
  selectedSelectionIndicator: {
    color: tokens.colorCompoundBrandBackground,
    boxShadow: "inset 0 0 0 3px var(--colorNeutralBackground1)",
    backgroundColor: "currentColor"
  },
  virtualSpacerCell: {
    padding: 0,
    border: 0
  }
});
