import { makeStyles, shorthands, tokens } from "@fluentui/react-components";

export const useClasses = makeStyles({
  container: {
    display: "flex",
    flexDirection: "column",
    width: "min(1120px, calc(100vw - 8px)) !important",
    maxWidth: "min(1120px, calc(100vw - 8px)) !important",
    maxHeight: "calc(100vh - 10px)",
    boxSizing: "border-box",
    opacity: "1 !important",
    scale: "1 !important",
    ...shorthands.padding(0),
    ...shorthands.overflow("hidden")
  },
  header: {
    color: tokens.colorNeutralForeground1,
    display: "flex",
    alignItems: "center",
    minHeight: "76px",
    boxSizing: "border-box",
    ...shorthands.padding(
      tokens.spacingVerticalS,
      tokens.spacingHorizontalMNudge,
      tokens.spacingVerticalS,
      tokens.spacingHorizontalXL
    ),
    "& h2": {
      ...shorthands.margin(0),
      fontSize: tokens.fontSizeBase500,
      lineHeight: tokens.lineHeightBase500,
      fontWeight: tokens.fontWeightSemibold,
      letterSpacing: 0
    }
  },
  body: {
    display: "grid",
    gridTemplateColumns:
      "minmax(120px, 1fr) minmax(111px, 0.92fr) minmax(67px, 0.56fr) minmax(215px, 1.8fr) minmax(127px, 1.06fr)",
    columnGap: tokens.spacingHorizontalXXL,
    alignItems: "start",
    minWidth: 0,
    width: "100%",
    boxSizing: "border-box",
    maxHeight: "calc(100vh - 74px)",
    ...shorthands.padding(0, "12px", "18px"),
    overflowX: "auto",
    overflowY: "auto",
    scrollbarWidth: "thin",
    "&::-webkit-scrollbar": {
      width: "6px",
      height: "6px"
    },
    "&::-webkit-scrollbar-thumb": {
      backgroundColor: tokens.colorNeutralStroke1,
      ...shorthands.borderRadius("3px")
    },
    "& > *": {
      minWidth: 0
    },
    "& > * [data-fluent-link]": {
      width: "fit-content",
      maxWidth: "100%",
      marginTop: tokens.spacingVerticalS,
      fontSize: tokens.fontSizeBase200,
      lineHeight: tokens.lineHeightBase200,
      letterSpacing: 0,
      whiteSpace: "nowrap"
    },
    "& > * h3": {
      fontWeight: tokens.fontWeightSemibold,
      fontSize: tokens.fontSizeBase200,
      lineHeight: tokens.lineHeightBase200,
      letterSpacing: 0,
      ...shorthands.margin(0)
    },
    "& > * .fui-Divider": {
      ...shorthands.margin("7px", 0, "10px")
    },
    "@media (min-width: 641px) and (max-width: 800px)": {
      gridTemplateColumns: "120px 111px 67px minmax(200px, 1fr) 119px"
    },
    "@media (max-width: 640px)": {
      gridTemplateColumns: "minmax(150px, 1fr) minmax(150px, 1fr)",
      minWidth: 0,
      rowGap: "28px",
      "& > :nth-child(4)": {
        gridColumn: "1 / -1"
      }
    }
  },
  closeButton: {
    color: tokens.colorNeutralForeground1,
    marginLeft: "auto",
    minWidth: "32px",
    width: "32px",
    height: "32px"
  },
  filterButton: {
    width: "128px",
    height: "38px",
    marginTop: "30px",
    ...shorthands.borderRadius("25px")
  },
  filterElementSelected: {
    color: tokens.colorNeutralForeground1,
    fontWeight: tokens.fontWeightBold
  },
  filterElementNotSelected: {
    color: tokens.colorNeutralForeground3
  },
  filterElementClearIcon: {
    width: "14px",
    height: "14px",
    marginLeft: tokens.spacingHorizontalSNudge,
    flexShrink: 0
  }
});
