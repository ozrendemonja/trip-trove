import { makeStyles, shorthands, tokens } from "@fluentui/react-components";

export const useMyTripListClasses = makeStyles({
  pageContainer: {
    ...shorthands.overflow("hidden"),
    ...shorthands.padding("24px", "32px"),
    ...shorthands.margin("16px"),
    boxSizing: "border-box",
    ...shorthands.borderRadius("30px"),
    backgroundColor: tokens.colorNeutralBackground1
  },
  pageHeader: {
    marginBottom: "32px"
  },
  pageTitle: {
    fontSize: "28px",
    fontWeight: tokens.fontWeightBold,
    color: tokens.colorNeutralForeground1
  },
  emptyState: {
    marginTop: "60px",
    ...shorthands.padding("40px"),
    ...shorthands.borderRadius("8px"),
    backgroundColor: tokens.colorNeutralBackground1,
    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
    maxWidth: "420px",
    textAlign: "center"
  },
  emptyIcon: {
    fontSize: "48px",
    color: tokens.colorNeutralForeground4,
    marginBottom: "16px"
  },
  emptyText: {
    fontSize: "16px",
    color: tokens.colorNeutralForeground3,
    marginBottom: "20px"
  },
  dateArrow: {
    fontSize: "18px",
    color: tokens.colorNeutralForeground3,
    ...shorthands.padding(0, "4px", "6px"),
    flexShrink: 0,
    userSelect: "none" as const,
    alignSelf: "flex-end"
  },
  dateField: {
    ...shorthands.flex(1)
  }
});
