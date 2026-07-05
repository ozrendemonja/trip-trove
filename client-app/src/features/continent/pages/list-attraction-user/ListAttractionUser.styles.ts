import { IDetailsRowStyles, mergeStyleSets, useTheme } from "@fluentui/react";
import { AttractionVisitStatus } from "../../domain/Attraction.types";

// Colours borrowed from the countries map so the list tells the same story:
// gold marks a place you still long for, grey a place you've already had your
// fill of. Keeping the language consistent means neither view needs a legend.
const RETURN_ICON = "#c98a00";
// A soft, restful grey — clearly "set aside / seen" without the heaviness of the
// map's full grey. The colour alone carries the message; no rule or icon needed.
const DONE_BG = "#eaedf0";
const DONE_BG_HOVER = "#e1e5e9";
const DONE_INK = "#5b666c";

export const useClasses = () => {
  const theme = useTheme();

  return mergeStyleSets({
    root: {
      display: "flex",
      justifyContent: "space-between",
      flexWrap: "wrap",
      padding: "12px",
      paddingBottom: "0px",
      maxHeight: "90%",
      maxWidth: "85%",
      borderRadius: "30px 30px 0 0",
      background: theme.palette.white
    },
    linkField: {
      overflow: "hidden",
      textOverflow: "ellipsis",
      maxWidth: "100%"
    }
  });
};

// Theme-independent, so they live at module scope and can be used straight from
// the column renderer without threading the hook through.
export const visitMarkerClasses = mergeStyleSets({
  // Just the loop symbol — a wordless nod that this is a place worth returning to.
  // The row's warm tint carries the rest of the meaning, so no label is needed.
  returnIcon: {
    fontSize: 16,
    color: RETURN_ICON,
    marginRight: 6,
    flexShrink: 0
  }
});

// Only the "already seen and done" rows get a soft muted-grey wash; every other
// row keeps the default styling (want-return is flagged by its Sync icon alone).
export const getVisitStatusRowStyles = (
  status?: AttractionVisitStatus
): Partial<IDetailsRowStyles> | undefined => {
  if (status === AttractionVisitStatus.VISITED_DONE) {
    return {
      root: {
        backgroundColor: DONE_BG,
        selectors: {
          "&:hover": { backgroundColor: DONE_BG_HOVER },
          ".ms-DetailsRow-cell": { color: DONE_INK },
          ".ms-Link": { color: DONE_INK }
        }
      }
    };
  }

  return undefined;
};
