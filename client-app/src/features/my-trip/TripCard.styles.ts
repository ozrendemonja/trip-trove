import {
  IButtonStyles,
  IPalette,
  mergeStyleSets,
  useTheme
} from "@fluentui/react";
import { TripStatus } from "./domain/Trip.types";

const TRIP_STATUS_COLORS: Record<
  TripStatus,
  (palette: IPalette) => { bg: string; text: string }
> = {
  active: (palette) => ({ bg: palette.greenLight, text: palette.greenDark }),
  past: () => ({ bg: "#fff3e0", text: "#e65100" }),
  archived: (palette) => ({
    bg: palette.neutralLighter,
    text: palette.neutralSecondary
  })
};

export const useTripCardClasses = (status: TripStatus) => {
  const theme = useTheme();
  const { bg, text } = TRIP_STATUS_COLORS[status](theme.palette);

  const deleteBtn: IButtonStyles = {
    root: {
      position: "absolute",
      top: 6,
      right: 6,
      backgroundColor: "rgba(0,0,0,0.45)",
      borderRadius: 4,
      width: 28,
      height: 28
    },
    icon: { color: theme.palette.white, fontSize: 13 },
    rootHovered: { backgroundColor: "rgba(180,0,0,0.85)" },
    rootPressed: { backgroundColor: "rgba(140,0,0,1)" },
    iconHovered: { color: "#ffffff" },
    iconPressed: { color: "#ffffff" }
  };

  const editBtn: IButtonStyles = {
    root: {
      position: "absolute",
      top: 6,
      right: 40,
      backgroundColor: "rgba(0,0,0,0.45)",
      borderRadius: 4,
      width: 28,
      height: 28
    },
    icon: { color: theme.palette.white, fontSize: 13 },
    rootHovered: { backgroundColor: "rgba(0,80,180,0.85)" },
    rootPressed: { backgroundColor: "rgba(0,60,140,1)" },
    iconHovered: { color: "#ffffff" },
    iconPressed: { color: "#ffffff" }
  };

  return {
    deleteBtn,
    editBtn,
    ...mergeStyleSets({
      card: {
        width: 220,
        borderRadius: 8,
        overflow: "hidden",
        backgroundColor: theme.palette.white,
        boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
        cursor: "pointer",
        transition: "box-shadow 0.2s, transform 0.2s",
        position: "relative",
        selectors: {
          ":hover": {
            boxShadow: "0 6px 20px rgba(0,0,0,0.18)",
            transform: "translateY(-3px)"
          }
        }
      },
      cardBanner: {
        height: 110,
        background: `linear-gradient(135deg, ${theme.palette.tealLight}, ${theme.palette.tealDark})`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative"
      },
      bannerIcon: {
        fontSize: 48,
        color: theme.palette.white
      },
      cardBody: {
        padding: "10px 16px 14px"
      },
      tripName: {
        fontSize: 18,
        fontWeight: 600,
        color: theme.palette.neutralDark,
        marginBottom: 4
      },
      dateText: {
        fontSize: 12,
        color: theme.palette.neutralSecondary
      },
      statusBadge: {
        display: "inline-block",
        fontSize: 11,
        fontWeight: 600,
        borderRadius: 4,
        padding: "2px 7px",
        marginTop: 6,
        textTransform: "uppercase",
        letterSpacing: "0.04em",
        backgroundColor: bg,
        color: text
      }
    })
  };
};
