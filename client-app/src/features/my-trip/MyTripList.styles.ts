import { makeStyles, shorthands, tokens } from "@fluentui/react-components";

export const useMyTripListClasses = makeStyles({
  pageContainer: {
    ...shorthands.overflow("hidden"),
    ...shorthands.padding(
      tokens.spacingVerticalXXL,
      tokens.spacingHorizontalXXXL
    ),
    ...shorthands.margin(tokens.spacingVerticalL),
    boxSizing: "border-box",
    ...shorthands.borderRadius("30px"),
    backgroundColor: tokens.colorNeutralBackground1
  },
  pageHeader: {
    marginBottom: tokens.spacingVerticalXXXL
  },
  pageTitle: {
    fontSize: tokens.fontSizeHero700,
    fontWeight: tokens.fontWeightBold,
    color: tokens.colorNeutralForeground1
  },
  emptyState: {
    marginTop: "60px",
    ...shorthands.padding("40px"),
    ...shorthands.borderRadius(tokens.borderRadiusXLarge),
    backgroundColor: tokens.colorNeutralBackground1,
    boxShadow: tokens.shadow4,
    maxWidth: "420px",
    textAlign: "center"
  },
  emptyIcon: {
    fontSize: "48px",
    color: tokens.colorNeutralForeground4,
    marginBottom: tokens.spacingVerticalL
  },
  emptyText: {
    fontSize: tokens.fontSizeBase400,
    color: tokens.colorNeutralForeground3,
    marginBottom: tokens.spacingVerticalXL
  },
  dateArrow: {
    fontSize: "18px",
    color: tokens.colorNeutralForeground3,
    ...shorthands.padding(
      0,
      tokens.spacingHorizontalXS,
      tokens.spacingVerticalSNudge
    ),
    flexShrink: 0,
    userSelect: "none" as const,
    alignSelf: "flex-end"
  },
  dateField: {
    ...shorthands.flex(1)
  }
});
