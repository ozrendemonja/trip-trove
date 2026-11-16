import { makeStyles, tokens } from "@fluentui/react-components";

export const useClasses = makeStyles({
  card: {
    minWidth: 0,
    paddingInline: tokens.spacingHorizontalL,
    paddingBottom: 0,
    rowGap: tokens.spacingVerticalS
  },
  topRow: {
    gridTemplateColumns: "auto minmax(0, 1fr) auto",
    minWidth: 0
  },
  backNavigation: {
    alignItems: "center",
    columnGap: tokens.spacingHorizontalM
  },
  backButton: {
    paddingInline: 0
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
    overflowWrap: "anywhere"
  },
  dates: {
    display: "flex",
    flexWrap: "wrap",
    columnGap: tokens.spacingHorizontalXS,
    color: tokens.colorNeutralForeground2
  },
  actions: {
    alignSelf: "center"
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
