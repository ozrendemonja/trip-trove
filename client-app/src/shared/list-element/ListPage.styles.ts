import { makeStyles, tokens } from "@fluentui/react-components";

export const useListPageClasses = makeStyles({
  pageLayout: {
    display: "flex",
    alignItems: "flex-start",
    minHeight: "calc(100vh - 16px)",
    "@media (max-width: 700px)": {
      flexDirection: "column",
      minHeight: 0,
      "& > :first-child": {
        position: "static",
        width: "calc(100% - 8px)",
        maxWidth: "none",
        height: "auto",
        marginRight: 0,
        marginBottom: tokens.spacingVerticalM
      },
      "& > :first-child [aria-label='Navigation menu']": {
        maxWidth: "none"
      },
      "& > :first-child > :last-child": {
        marginTop: tokens.spacingVerticalL
      }
    }
  },
  content: {
    minWidth: 0,
    flexGrow: 1,
    overflow: "hidden",
    "@media (max-width: 700px)": {
      width: "100%"
    }
  }
});
