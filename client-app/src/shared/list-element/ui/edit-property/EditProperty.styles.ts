import { makeStyles, shorthands } from "@fluentui/react-components";

export const useClasses = makeStyles({
  modalContainer: {
    width: "720px",
    minWidth: 0,
    maxWidth: "calc(100vw - 32px)",
    boxSizing: "border-box",
    ...shorthands.borderRadius("30px")
  },
  heading: {
    fontWeight: "600",
    fontSize: "30px",
    lineHeight: "36px",
    overflowWrap: "anywhere",
    ...shorthands.margin(0),
    "@media (max-width: 480px)": {
      fontSize: "24px",
      lineHeight: "30px"
    }
  },
  content: {
    minWidth: 0,
    paddingTop: "4px"
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    width: "100%",
    minWidth: 0
  },
  editIcon: {
    color: "#fec703"
  },
  footer: {
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "flex-end",
    gap: "12px",
    paddingTop: "8px",
    "& > button": {
      minWidth: "112px"
    },
    "@media (max-width: 480px)": {
      "& > button": {
        flexGrow: 1
      }
    }
  },
  closeIcon: {
    flexShrink: 0
  }
});
