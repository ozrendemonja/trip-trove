import { makeStyles, shorthands, tokens } from "@fluentui/react-components";

export const useClasses = makeStyles({
  pageLayout: {
    display: "flex",
    alignItems: "flex-start",
    minHeight: "calc(100vh - 16px)",
    "& > :first-child": {
      width: "128px",
      maxWidth: "128px",
      height: "auto",
      boxSizing: "border-box",
      marginRight: "30px",
      flexShrink: 0,
      ...shorthands.padding(
        tokens.spacingVerticalS,
        tokens.spacingHorizontalSNudge
      )
    },
    "& > :first-child > :last-child": {
      marginTop: "36px",
      fontSize: "11px"
    },
    "& > :first-child [aria-label='Navigation menu']": {
      width: "100%",
      marginTop: "18px"
    },
    "& > :first-child [aria-label='Navigation menu'] > div": {
      marginBottom: tokens.spacingVerticalXXL
    },
    "& > :first-child [aria-label='Navigation menu'] > div:last-child": {
      marginBottom: 0
    },
    "& > :first-child [aria-label='Navigation menu'] a, & > :first-child [aria-label='Navigation menu'] button":
      {
        minHeight: "32px",
        columnGap: "7px",
        fontSize: tokens.fontSizeBase200,
        ...shorthands.padding(0, tokens.spacingHorizontalSNudge)
      },
    "& > :first-child [aria-label='Navigation menu'] > div > div": {
      rowGap: 0
    },
    "& > :first-child [aria-label='Navigation menu'] svg": {
      width: "14px",
      height: "14px"
    },
    "& > :first-child .navigationHeaders": {
      fontSize: "11px"
    }
  },
  content: {
    minWidth: 0,
    flexGrow: 1,
    overflow: "hidden"
  },
  root: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "nowrap",
    ...shorthands.padding(0, tokens.spacingHorizontalM),
    minHeight: "72px",
    boxSizing: "border-box",
    width: "calc(100% - 19px)",
    ...shorthands.borderRadius("20px", "20px", 0, 0),
    backgroundColor: tokens.colorNeutralBackground1,
    "& > .fui-SearchBox": {
      alignSelf: "center",
      width: "320px",
      height: "28px",
      minHeight: "28px",
      marginTop: 0
    },
    "& > .fui-SearchBox input": {
      height: "26px",
      fontSize: tokens.fontSizeBase200
    },
    "& > div:last-child > button": {
      width: "76px",
      minWidth: "76px",
      height: "28px",
      marginTop: "0 !important",
      fontSize: tokens.fontSizeBase200
    },
    "& > div:last-child > button svg": {
      width: "14px",
      height: "14px"
    }
  },
  listViewport: {
    width: "calc(100% - 19px)",
    ...shorthands.overflow("auto"),
    ...shorthands.borderRadius(0, 0, "20px", "20px"),
    paddingBottom: tokens.spacingVerticalXL,
    backgroundColor: tokens.colorNeutralBackground1,
    "& [role='grid']": {
      width: "100%",
      maxWidth: "none",
      color: tokens.colorNeutralForeground1,
      fontSize: tokens.fontSizeBase200
    },
    "& [role='columnheader']": {
      height: "34px",
      fontSize: "11px",
      fontWeight: tokens.fontWeightSemibold,
      color: tokens.colorNeutralForeground2
    },
    "& [role='gridcell']": {
      boxSizing: "border-box",
      verticalAlign: "top",
      lineHeight: tokens.lineHeightBase200,
      ...shorthands.padding("9px", "8px")
    },
    "& th:nth-child(1), & td:nth-child(1)": {
      width: "16%"
    },
    "& th:nth-child(2), & td:nth-child(2)": {
      width: "13.5%"
    },
    "& th:nth-child(3), & td:nth-child(3)": {
      width: "11%"
    },
    "& th:nth-child(4), & td:nth-child(4)": {
      width: "14%"
    },
    "& th:nth-child(5), & td:nth-child(5)": {
      width: "8.5%"
    },
    "& th:nth-child(6), & td:nth-child(6)": {
      width: "12.5%"
    },
    "& th:nth-child(7), & td:nth-child(7)": {
      width: "24.5%"
    }
  },
  linkField: {
    ...shorthands.overflow("hidden"),
    textOverflow: "ellipsis",
    maxWidth: "100%",
    color: tokens.colorBrandBackground,
    "&:visited": {
      color: tokens.colorBrandBackground
    },
    "&:hover, &:active": {
      color: tokens.colorBrandBackgroundHover
    }
  },
  markerSlot: {
    width: "16px",
    minWidth: "16px",
    height: "16px",
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginTop: "1px"
  },
  returnIcon: {
    width: "14px",
    height: "14px",
    fontSize: tokens.fontSizeBase300,
    fontWeight: tokens.fontWeightBold,
    color: tokens.colorBrandForeground2,
    flexShrink: 0
  },
  pinIcon: {
    width: "12px",
    height: "12px",
    color: tokens.colorStatusDangerForeground1,
    flexShrink: 0
  },
  traditionalIcon: {
    width: "14px",
    height: "14px",
    marginLeft: "3px",
    color: tokens.colorStatusWarningForeground1,
    flexShrink: 0
  },
  flagIcon: {
    width: "14px",
    height: "14px",
    marginLeft: "4px",
    color: tokens.colorStatusSuccessForeground1,
    flexShrink: 0
  },
  changeSoonIcon: {
    width: "14px",
    height: "14px",
    marginLeft: "4px",
    color: tokens.colorStatusDangerForeground1,
    flexShrink: 0
  },
  changePotentialIcon: {
    width: "14px",
    height: "14px",
    marginLeft: "4px",
    color: tokens.colorStatusWarningForeground1,
    flexShrink: 0
  },
  infoText: {
    color: tokens.colorNeutralForeground1
  },
  categoryText: {
    maxWidth: "100%",
    overflowWrap: "anywhere"
  },
  pageInfo: {
    alignItems: "center",
    fontSize: "22px",
    lineHeight: tokens.lineHeightBase500,
    marginBottom: tokens.spacingVerticalXXL,
    "& > svg": {
      width: "22px",
      height: "22px"
    },
    "& > span": {
      fontSize: "22px",
      lineHeight: tokens.lineHeightBase500
    }
  },
  pageName: {
    fontSize: "22px",
    lineHeight: tokens.lineHeightBase500
  },
  pageUnder: {
    fontSize: "22px",
    lineHeight: tokens.lineHeightBase500,
    color: tokens.colorNeutralForeground3
  },
  heading: {
    marginTop: 0,
    marginBottom: 0,
    paddingLeft: "2px",
    fontSize: tokens.fontSizeBase500,
    lineHeight: "26px",
    fontWeight: tokens.fontWeightMedium
  },
  searchBox: {
    marginTop: 0,
    width: "320px"
  },
  doneRow: {
    backgroundColor: tokens.colorNeutralBackground2,
    "&:hover": {
      backgroundColor: tokens.colorNeutralBackground2Hover
    },
    '& [role="gridcell"]': {
      color: tokens.colorNeutralForeground2
    },
    "& [data-fluent-link]": {
      color: tokens.colorNeutralForeground2
    }
  }
});
