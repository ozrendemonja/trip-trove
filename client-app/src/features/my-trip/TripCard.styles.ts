import { makeStyles, shorthands, tokens } from "@fluentui/react-components";

const TRIP_TEAL_LIGHT = "#61A9B4";
const TRIP_TEAL_DARK = "#3d7f8a";

export const useTripCardClasses = makeStyles({
  card: {
    width: "220px",
    ...shorthands.borderRadius(tokens.borderRadiusXLarge),
    ...shorthands.overflow("hidden"),
    backgroundColor: tokens.colorNeutralBackground1,
    boxShadow: tokens.shadow8,
    cursor: "pointer",
    ...shorthands.transition([
      ["box-shadow", "0.2s", "0s", "ease"],
      ["transform", "0.2s", "0s", "ease"]
    ]),
    position: "relative",
    "&:hover": {
      boxShadow: tokens.shadow16,
      transform: "translateY(-3px)"
    }
  },
  cardBanner: {
    height: "110px",
    backgroundImage: `linear-gradient(135deg, ${TRIP_TEAL_LIGHT}, ${TRIP_TEAL_DARK})`,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    position: "relative"
  },
  bannerIcon: {
    fontSize: "48px",
    color: tokens.colorNeutralBackground1
  },
  cardBody: {
    ...shorthands.padding(
      tokens.spacingVerticalMNudge,
      tokens.spacingHorizontalL,
      "14px"
    )
  },
  tripName: {
    fontSize: "18px",
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
    marginBottom: tokens.spacingVerticalXS
  },
  dateText: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground2
  },
  statusBadge: {
    display: "inline-block",
    fontSize: "11px",
    fontWeight: tokens.fontWeightSemibold,
    ...shorthands.borderRadius(tokens.borderRadiusMedium),
    ...shorthands.padding("2px", "7px"),
    marginTop: tokens.spacingVerticalSNudge,
    textTransform: "uppercase",
    letterSpacing: "0.04em"
  },
  statusActive: {
    backgroundColor: tokens.colorStatusSuccessBackground1,
    color: tokens.colorStatusSuccessForeground1
  },
  statusPast: {
    backgroundColor: tokens.colorStatusWarningBackground1,
    color: tokens.colorStatusWarningForeground1
  },
  statusArchived: {
    backgroundColor: tokens.colorNeutralBackground2,
    color: tokens.colorNeutralForeground2
  },
  cardAction: {
    position: "absolute",
    top: "6px",
    backgroundColor: "rgba(0,0,0,0.45)",
    ...shorthands.borderRadius(tokens.borderRadiusMedium),
    width: "28px",
    height: "28px",
    minWidth: "28px",
    ...shorthands.padding(0),
    "& svg": {
      color: tokens.colorNeutralForegroundInverted,
      fontSize: "13px"
    },
    "&:hover svg": {
      color: tokens.colorNeutralForegroundInverted
    },
    "&:active svg": {
      color: tokens.colorNeutralForegroundInverted
    }
  },
  editButton: {
    right: "40px",
    "&:hover": {
      backgroundColor: tokens.colorBrandBackgroundHover
    },
    "&:active": {
      backgroundColor: tokens.colorBrandBackgroundPressed
    }
  },
  deleteButton: {
    right: "6px",
    backgroundColor: tokens.colorPaletteRedForeground1,
    "&:hover": {
      backgroundColor: tokens.colorPaletteRedForeground1
    },
    "&:active": {
      backgroundColor: tokens.colorPaletteRedForeground1
    }
  }
});
