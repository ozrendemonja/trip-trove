import { makeStyles, tokens } from "@fluentui/react-components";

export const useClasses = makeStyles({
  card: {
    containerType: "inline-size",
    minWidth: 0,
    paddingInline: tokens.spacingHorizontalL,
    paddingBottom: 0,
    rowGap: tokens.spacingVerticalS
  },
  topRow: {
    gridTemplateColumns: "auto minmax(0, 1fr) auto",
    minWidth: 0,
    "@container (max-width: 440px)": {
      gridTemplateColumns: "auto minmax(0, 1fr)",
      rowGap: tokens.spacingVerticalS
    }
  },
  backNavigation: {
    alignItems: "center",
    columnGap: tokens.spacingHorizontalM,
    "@container (max-width: 850px)": {
      columnGap: tokens.spacingHorizontalS
    }
  },
  backButton: {
    paddingInline: 0,
    "@container (max-width: 850px)": {
      minWidth: "32px",
      width: "32px"
    }
  },
  backLabel: {
    "@container (max-width: 850px)": {
      display: "none"
    }
  },
  backDivider: {
    alignSelf: "stretch",
    minHeight: "32px"
  },
  identity: {
    minWidth: 0
  },
  name: {
    margin: 0,
    display: "block",
    overflow: "hidden",
    whiteSpace: "nowrap",
    textOverflow: "ellipsis"
  },
  dates: {
    display: "flex",
    flexWrap: "wrap",
    columnGap: tokens.spacingHorizontalXS,
    color: tokens.colorNeutralForeground2,
    "@container (max-width: 850px)": {
      display: "none"
    }
  },
  actions: {
    alignSelf: "center",
    minHeight: "32px",
    display: "flex",
    alignItems: "center",
    columnGap: tokens.spacingHorizontalS,
    whiteSpace: "nowrap",
    "@container (max-width: 440px)": {
      gridColumn: "1 / -1",
      justifyContent: "flex-end",
      flexWrap: "wrap"
    }
  },
  steps: {
    display: "grid",
    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
    columnGap: tokens.spacingHorizontalM,
    listStyleType: "none",
    margin: 0,
    padding: 0
  },
  step: {
    display: "flex",
    alignItems: "flex-start",
    minWidth: 0,
    columnGap: tokens.spacingHorizontalM
  },
  stepConnector: {
    flex: "1 0 12px",
    minWidth: "12px",
    marginTop: "18px"
  },
  stepButton: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "flex-start",
    columnGap: tokens.spacingHorizontalS,
    minWidth: 0,
    minHeight: "68px",
    padding: `${tokens.spacingVerticalS} 0`,
    borderRadius: 0,
    borderBottom: `3px solid ${tokens.colorTransparentStroke}`,
    textAlign: "left",
    fontWeight: tokens.fontWeightRegular,
    "&[aria-current='step']": {
      borderBottomColor: tokens.colorBrandStroke1
    }
  },
  number: {
    flexShrink: 0
  },
  stepText: {
    display: "flex",
    flexDirection: "column",
    minWidth: 0
  },
  purpose: {
    color: tokens.colorNeutralForeground2
  }
});
