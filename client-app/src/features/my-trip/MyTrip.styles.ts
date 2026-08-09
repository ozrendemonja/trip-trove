import { makeStyles, shorthands } from "@fluentui/react-components";

const defaultSearchOption = {
  marginRight: "12px"
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
    overflowY: "visible",
    paddingTop: "12px",
    paddingBottom: "8px"
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
    marginLeft: 4
  },
  tripName: {
    fontSize: 30,
    ...shorthands.paddingInline(10)
  }
});
