import { makeStyles, shorthands, tokens } from "@fluentui/react-components";

const defaultSearchOption = {
  marginRight: tokens.spacingHorizontalM
};

export const useClasses = makeStyles({
  notSelectedSearchOption: {
    ...defaultSearchOption,
    ...shorthands.textDecoration("underline"),
    "&:focus": {
      color: tokens.colorNeutralForeground1,
      ...shorthands.textDecoration("none")
    },
    "&:active": {
      color: tokens.colorNeutralForeground1,
      ...shorthands.textDecoration("none")
    },
    "&:hover": {
      color: tokens.colorNeutralForeground1,
      ...shorthands.textDecoration("none")
    }
  },
  selectedSearchOption: {
    ...defaultSearchOption,
    color: tokens.colorNeutralForeground1,
    ...shorthands.textDecoration("none"),
    fontWeight: tokens.fontWeightBold,
    "&:focus": {
      color: tokens.colorNeutralForeground1,
      ...shorthands.textDecoration("none")
    },
    "&:active": {
      color: tokens.colorNeutralForeground1,
      ...shorthands.textDecoration("none")
    },
    "&:hover": {
      color: tokens.colorNeutralForeground1,
      ...shorthands.textDecoration("none")
    }
  },
  searchContiner: {
    position: "absolute",
    left: "50%"
  },
  searchModalContent: {
    overflowX: "visible",
    overflowY: "visible",
    paddingTop: tokens.spacingVerticalM,
    paddingBottom: tokens.spacingVerticalS
  },
  searchModalLayout: {
    width: "100%",
    minWidth: 0
  },
  searchOptions: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    width: "100%",
    minWidth: 0
  },
  backButton: {
    marginLeft: tokens.spacingHorizontalXS
  },
  tripName: {
    fontSize: 30,
    ...shorthands.paddingInline(tokens.spacingHorizontalMNudge)
  }
});
