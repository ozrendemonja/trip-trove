import { makeStyles, shorthands } from "@fluentui/react-components";

export const useListPageClasses = makeStyles({
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
      ...shorthands.padding("8px", "6px")
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
      marginBottom: "24px"
    },
    "& > :first-child [aria-label='Navigation menu'] > div:last-child": {
      marginBottom: 0
    },
    "& > :first-child [aria-label='Navigation menu'] a, & > :first-child [aria-label='Navigation menu'] button":
      {
        minHeight: "32px",
        columnGap: "7px",
        fontSize: "12px",
        ...shorthands.padding(0, "6px")
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
    },
    "@media (max-width: 700px)": {
      flexDirection: "column",
      minHeight: 0,
      "& > :first-child": {
        position: "static",
        width: "calc(100% - 8px)",
        maxWidth: "none",
        height: "auto",
        marginRight: 0,
        marginBottom: "12px"
      },
      "& > :first-child [aria-label='Navigation menu']": {
        maxWidth: "none"
      },
      "& > :first-child > :last-child": {
        marginTop: "16px"
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
