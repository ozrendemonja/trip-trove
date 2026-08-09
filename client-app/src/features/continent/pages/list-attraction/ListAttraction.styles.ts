import { makeStyles, shorthands, tokens } from "@fluentui/react-components";

export const useClasses = makeStyles({
  headerRoot: {
    width: "calc(100% - 19px)",
    maxWidth: "none",
    minHeight: "86px",
    boxSizing: "border-box",
    ...shorthands.padding("8px", "12px", 0),
    ...shorthands.borderRadius("20px", "20px", 0, 0),
    "@media (max-width: 700px)": {
      width: "calc(100% - 8px)",
      minHeight: "176px",
      ...shorthands.padding("10px", "12px", 0)
    }
  },
  listViewport: {
    width: "calc(100% - 19px)",
    height: "calc(100vh - 118px)",
    ...shorthands.overflow("auto"),
    ...shorthands.borderRadius(0, 0, "20px", "20px"),
    paddingBottom: "20px",
    backgroundColor: tokens.colorNeutralBackground1,
    "@media (max-width: 700px)": {
      width: "calc(100% - 8px)",
      height: "70vh"
    }
  },
  table: {
    width: "100%",
    maxWidth: "none",
    tableLayout: "fixed",
    paddingBottom: 0,
    color: tokens.colorNeutralForeground1,
    fontSize: tokens.fontSizeBase200,
    ...shorthands.borderRadius(0),
    "& th": {
      height: "34px",
      ...shorthands.padding(0, "10px"),
      color: tokens.colorNeutralForeground2,
      fontSize: tokens.fontSizeBase200,
      fontWeight: tokens.fontWeightSemibold,
      verticalAlign: "middle"
    },
    "& tbody tr": {
      minHeight: "50px"
    },
    "& td": {
      boxSizing: "border-box",
      ...shorthands.padding("9px", "8px"),
      borderBottomColor: tokens.colorNeutralStroke2,
      borderBottomStyle: "solid",
      borderBottomWidth: "1px",
      lineHeight: tokens.lineHeightBase200,
      overflowWrap: "anywhere",
      verticalAlign: "top"
    },
    "& td > div": {
      minWidth: 0
    },
    "& td svg": {
      width: "14px",
      height: "14px"
    },
    "& [data-list-edit-trigger]": {
      width: "28px",
      minWidth: "28px",
      height: "28px",
      minHeight: "28px",
      flexShrink: 0,
      ...shorthands.padding(0)
    },
    "& .attraction-list-name-cell": {
      width: "100%",
      minWidth: 0
    },
    "& .attraction-list-name-cell > button": {
      width: "28px",
      minWidth: "28px",
      height: "28px",
      minHeight: "28px",
      flexShrink: 0,
      ...shorthands.padding(0)
    }
  },
  linkField: {
    ...shorthands.overflow("hidden"),
    textOverflow: "ellipsis",
    maxWidth: "100%",
    color: tokens.colorBrandBackground,
    fontSize: tokens.fontSizeBase200,
    lineHeight: tokens.lineHeightBase200,
    textUnderlineOffset: "2px",
    "&:visited": {
      color: tokens.colorBrandBackground
    },
    "&:hover, &:active": {
      color: tokens.colorBrandBackgroundHover
    }
  }
});
