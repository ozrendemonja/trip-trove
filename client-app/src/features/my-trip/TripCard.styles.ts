import { makeStyles, shorthands, tokens } from "@fluentui/react-components";

const TRIP_GREEN_LIGHT = "#e6f4ea";
const TRIP_GREEN_DARK = "#2e7d32";
const TRIP_TEAL_LIGHT = "#61A9B4";
const TRIP_TEAL_DARK = "#3d7f8a";
const TRIP_ORANGE_LIGHT = "#fff3e0";
const TRIP_ORANGE_DARK = "#e65100";

export const useTripCardClasses = makeStyles({
  card: {
    width: "220px",
    ...shorthands.borderRadius("8px"),
    ...shorthands.overflow("hidden"),
    backgroundColor: tokens.colorNeutralBackground1,
    boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
    cursor: "pointer",
    ...shorthands.transition([
      ["box-shadow", "0.2s", "0s", "ease"],
      ["transform", "0.2s", "0s", "ease"]
    ]),
    position: "relative",
    "&:hover": {
      boxShadow: "0 6px 20px rgba(0,0,0,0.18)",
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
    ...shorthands.padding("10px", "16px", "14px")
  },
  tripName: {
    fontSize: "18px",
    fontWeight: 600,
    color: tokens.colorNeutralForeground1,
    marginBottom: "4px"
  },
  dateText: {
    fontSize: "12px",
    color: tokens.colorNeutralForeground2
  },
  statusBadge: {
    display: "inline-block",
    fontSize: "11px",
    fontWeight: 600,
    ...shorthands.borderRadius("4px"),
    ...shorthands.padding("2px", "7px"),
    marginTop: "6px",
    textTransform: "uppercase",
    letterSpacing: "0.04em"
  },
  statusActive: {
    backgroundColor: TRIP_GREEN_LIGHT,
    color: TRIP_GREEN_DARK
  },
  statusPast: {
    backgroundColor: TRIP_ORANGE_LIGHT,
    color: TRIP_ORANGE_DARK
  },
  statusArchived: {
    backgroundColor: tokens.colorNeutralBackground2,
    color: tokens.colorNeutralForeground2
  },
  cardAction: {
    position: "absolute",
    top: "6px",
    backgroundColor: "rgba(0,0,0,0.45)",
    ...shorthands.borderRadius("4px"),
    width: "28px",
    height: "28px",
    minWidth: "28px",
    ...shorthands.padding(0),
    "& svg": {
      color: tokens.colorNeutralBackground1,
      fontSize: "13px"
    },
    "&:hover svg": {
      color: tokens.colorNeutralBackground1
    },
    "&:active svg": {
      color: tokens.colorNeutralBackground1
    }
  },
  editButton: {
    right: "40px",
    "&:hover": {
      backgroundColor: "rgba(0,80,180,0.85)"
    },
    "&:active": {
      backgroundColor: "rgba(0,60,140,1)"
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
