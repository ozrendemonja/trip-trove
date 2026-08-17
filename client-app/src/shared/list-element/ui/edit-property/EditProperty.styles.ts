import { makeStyles, shorthands, tokens } from "@fluentui/react-components";

export const useClasses = makeStyles({
  modalContainer: {
    width: "720px",
    minWidth: 0,
    maxWidth: "calc(100vw - 32px)",
    boxSizing: "border-box",
    ...shorthands.borderRadius("30px")
  },
  heading: {
    fontWeight: tokens.fontWeightSemibold,
    fontSize: "30px",
    lineHeight: tokens.lineHeightHero700,
    overflowWrap: "anywhere",
    ...shorthands.margin(0),
    "@media (max-width: 480px)": {
      fontSize: tokens.fontSizeBase600,
      lineHeight: "30px"
    }
  },
  content: {
    minWidth: 0,
    paddingTop: tokens.spacingVerticalXS
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalM,
    width: "100%",
    minWidth: 0
  },
  editIcon: {
    color: tokens.colorBrandBackground
  },
  footer: {
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "flex-end",
    gap: tokens.spacingHorizontalM,
    paddingTop: tokens.spacingVerticalS,
    "& > button": {
      minWidth: "112px"
    },
    "& > button:first-child": {
      minWidth: "128px"
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
