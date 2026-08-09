import { makeStyles, shorthands } from "@fluentui/react-components";

const defaultSearchOption = {
  marginRight: 12,
  marginBottom: -10
};

export const useClasses = makeStyles({
  notSelectedSearchOption: {
    ...defaultSearchOption,
    ...shorthands.textDecoration("underline"),
    "&:focus": {
      color: "black",
      ...shorthands.textDecoration("none")
    },
    "&:active": {
      color: "black",
      ...shorthands.textDecoration("none")
    },
    "&:hover": {
      color: "black",
      ...shorthands.textDecoration("none")
    }
  },
  selectedSearchOption: {
    ...defaultSearchOption,
    color: "black",
    ...shorthands.textDecoration("none"),
    fontWeight: "bold",
    "&:focus": {
      color: "black",
      ...shorthands.textDecoration("none")
    },
    "&:active": {
      color: "black",
      ...shorthands.textDecoration("none")
    },
    "&:hover": {
      color: "black",
      ...shorthands.textDecoration("none")
    }
  },
  searchContiner: {
    position: "absolute",
    left: "50%"
  },
  searchModalContent: {
    overflowX: "visible",
    overflowY: "visible"
  },
  backButton: {
    marginLeft: 4
  },
  tripName: {
    fontSize: 30,
    ...shorthands.paddingInline(10)
  }
});
