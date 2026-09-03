import { makeStyles, shorthands, tokens } from "@fluentui/react-components";

export const useBucketListClasses = makeStyles({
  surface: {
    width: "calc(100% - 19px)",
    minHeight: "calc(100vh - 32px)",
    boxSizing: "border-box",
    backgroundColor: tokens.colorNeutralBackground1,
    ...shorthands.borderRadius("20px"),
    ...shorthands.overflow("hidden"),
    "@media (max-width: 700px)": {
      width: "calc(100% - 8px)",
      minHeight: "70vh"
    }
  },
  header: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    columnGap: tokens.spacingHorizontalL,
    minHeight: "86px",
    boxSizing: "border-box",
    ...shorthands.padding(
      tokens.spacingVerticalL,
      tokens.spacingHorizontalXL,
      tokens.spacingVerticalS
    ),
    borderBottomColor: tokens.colorNeutralStroke2,
    borderBottomStyle: "solid",
    borderBottomWidth: tokens.strokeWidthThin,
    "@media (max-width: 700px)": {
      flexDirection: "column",
      alignItems: "flex-start",
      rowGap: tokens.spacingVerticalM,
      ...shorthands.padding(tokens.spacingVerticalM, tokens.spacingHorizontalM)
    }
  },
  addButton: {
    flexShrink: 0,
    whiteSpace: "nowrap"
  },
  title: {
    margin: 0,
    fontSize: tokens.fontSizeBase600,
    lineHeight: tokens.lineHeightBase600,
    fontWeight: tokens.fontWeightSemibold,
    letterSpacing: 0
  },
  subtitle: {
    color: tokens.colorNeutralForeground3,
    fontSize: tokens.fontSizeBase200
  },
  tabs: {
    ...shorthands.padding(
      tokens.spacingVerticalS,
      tokens.spacingHorizontalXL,
      0
    )
  },
  tableViewport: {
    width: "100%",
    ...shorthands.overflow("auto"),
    paddingBottom: tokens.spacingVerticalXL
  },
  table: {
    minWidth: "980px",
    tableLayout: "fixed",
    color: tokens.colorNeutralForeground1,
    fontSize: tokens.fontSizeBase200,
    "& th": {
      height: "38px",
      ...shorthands.padding(0, tokens.spacingHorizontalMNudge),
      color: tokens.colorNeutralForeground2,
      fontWeight: tokens.fontWeightSemibold
    },
    "& td": {
      boxSizing: "border-box",
      ...shorthands.padding("10px", "8px"),
      borderBottomColor: tokens.colorNeutralStroke2,
      borderBottomStyle: "solid",
      borderBottomWidth: tokens.strokeWidthThin,
      overflowWrap: "anywhere",
      verticalAlign: "middle"
    }
  },
  pagination: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    rowGap: tokens.spacingVerticalS,
    ...shorthands.padding(
      tokens.spacingVerticalM,
      tokens.spacingHorizontalM,
      tokens.spacingVerticalXL
    )
  },
  paginationError: {
    color: tokens.colorPaletteRedForeground1
  },
  sortButton: {
    minWidth: 0,
    height: "100%",
    justifyContent: "flex-start",
    color: "inherit",
    fontWeight: "inherit",
    ...shorthands.padding(0)
  },
  editableCell: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr) 28px",
    alignItems: "center",
    columnGap: tokens.spacingHorizontalXS,
    minWidth: 0
  },
  name: {
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1
  },
  completedName: {
    color: tokens.colorNeutralForeground3,
    textDecorationLine: "line-through"
  },
  location: {
    color: tokens.colorNeutralForeground2
  },
  description: {
    display: "-webkit-box",
    WebkitLineClamp: 2,
    WebkitBoxOrient: "vertical",
    ...shorthands.overflow("hidden"),
    color: tokens.colorNeutralForeground2
  },
  muted: {
    color: tokens.colorNeutralForeground4
  },
  tripName: {
    color: tokens.colorNeutralForeground3,
    fontSize: tokens.fontSizeBase100
  },
  actions: {
    minWidth: "88px"
  },
  iconButton: {
    width: "28px",
    minWidth: "28px",
    height: "28px",
    minHeight: "28px",
    ...shorthands.padding(0)
  },
  emptyState: {
    minHeight: "320px",
    textAlign: "center",
    color: tokens.colorNeutralForeground3,
    ...shorthands.padding(tokens.spacingVerticalXXXL)
  },
  emptyIcon: {
    width: "38px",
    height: "38px",
    color: tokens.colorBrandForeground1
  },
  errorBar: {
    ...shorthands.margin(tokens.spacingVerticalM, tokens.spacingHorizontalXL)
  },
  form: {
    minWidth: "min(520px, 75vw)",
    "@media (max-width: 700px)": {
      minWidth: 0
    }
  },
  completionDialog: {
    width: "min(440px, calc(100vw - 32px))"
  },
  completionContent: {
    display: "flex",
    flexDirection: "column",
    rowGap: tokens.spacingVerticalM
  },
  locationField: {
    rowGap: tokens.spacingVerticalS
  },
  locationOptions: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    columnGap: tokens.spacingHorizontalM,
    "@media (max-width: 430px)": {
      gridTemplateColumns: "1fr"
    }
  },
  search: {
    width: "100%"
  }
});
