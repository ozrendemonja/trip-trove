import { makeStyles, shorthands, tokens } from "@fluentui/react-components";

export const useReviewStyles = makeStyles({
  reviewSection: {
    marginTop: tokens.spacingVerticalXS
  },
  reviewAttached: {
    backgroundColor: tokens.colorNeutralBackground1,
    ...shorthands.border("1px", "solid", tokens.colorNeutralStroke2),
    ...shorthands.borderLeft(
      "3px",
      "solid",
      tokens.colorPaletteGreenBorderActive
    ),
    ...shorthands.borderRadius(tokens.borderRadiusXLarge),
    ...shorthands.padding(
      tokens.spacingVerticalS,
      tokens.spacingHorizontalMNudge
    ),
    fontSize: "0.7rem"
  },
  reviewForm: {
    backgroundColor: tokens.colorNeutralBackground1,
    ...shorthands.border("1px", "solid", tokens.colorNeutralStroke2),
    ...shorthands.borderRadius(tokens.borderRadiusXLarge),
    ...shorthands.padding(tokens.spacingVerticalMNudge)
  },
  attachedRating: {
    fontWeight: tokens.fontWeightMedium,
    color: tokens.colorNeutralForeground1,
    fontSize: "0.7rem"
  },
  attachedNote: {
    color: tokens.colorNeutralForeground2,
    whiteSpace: "pre-line",
    fontSize: "0.65rem"
  },
  removeButton: {
    backgroundColor: tokens.colorTransparentBackground,
    ...shorthands.border("0", "none"),
    ...shorthands.borderRadius(tokens.borderRadiusCircular),
    ...shorthands.padding(tokens.spacingVerticalXS),
    color: tokens.colorPaletteRedForeground1,
    minWidth: "0",
    minHeight: "0",
    height: "24px",
    width: "24px",
    "& svg": { fontSize: "0.65rem" },
    "&:hover": {
      backgroundColor: tokens.colorNeutralBackground3,
      color: tokens.colorPaletteRedForeground1
    },
    "&:disabled": {
      opacity: 0.4,
      cursor: "not-allowed"
    }
  },
  ratingButton: {
    ...shorthands.border("1px", "solid"),
    ...shorthands.borderRadius(tokens.borderRadiusCircular),
    ...shorthands.padding(tokens.spacingVerticalXS, tokens.spacingHorizontalS),
    cursor: "pointer",
    ...shorthands.transition([
      ["background-color", tokens.durationFast, "0s", tokens.curveEasyEase],
      ["border-color", tokens.durationFast, "0s", tokens.curveEasyEase],
      ["box-shadow", tokens.durationFast, "0s", tokens.curveEasyEase]
    ]),
    minWidth: "0",
    minHeight: "0",
    height: "auto",
    lineHeight: "1",
    "& [data-button-label]": {
      fontSize: tokens.fontSizeBase400,
      lineHeight: "1",
      ...shorthands.padding(0)
    }
  },
  ratingButtonActive: {
    backgroundColor: tokens.colorBrandBackground2,
    ...shorthands.borderColor(tokens.colorBrandStroke1),
    "&:hover": {
      backgroundColor: tokens.colorBrandBackground2,
      ...shorthands.borderColor(tokens.colorBrandStroke1)
    }
  },
  ratingButtonInactive: {
    backgroundColor: tokens.colorNeutralBackground1,
    ...shorthands.borderColor(tokens.colorNeutralStroke2),
    "&:hover": {
      backgroundColor: tokens.colorNeutralBackground3,
      ...shorthands.borderColor(tokens.colorNeutralStroke1)
    }
  },
  noteInput: {
    ...shorthands.border("1px", "solid", tokens.colorNeutralStroke2),
    ...shorthands.borderRadius(tokens.borderRadiusMedium),
    backgroundColor: tokens.colorNeutralBackground1,
    "&:hover": {
      ...shorthands.borderColor(tokens.colorNeutralStroke1)
    },
    "&:focus-within": {
      ...shorthands.borderColor(tokens.colorBrandStroke1),
      boxShadow: `0 0 0 1px ${tokens.colorBrandStroke1}`
    },
    "& textarea": {
      fontSize: "0.7rem",
      ...shorthands.padding(
        tokens.spacingVerticalSNudge,
        tokens.spacingHorizontalS
      ),
      color: tokens.colorNeutralForeground1
    }
  },
  reviewActions: {
    alignSelf: "flex-start"
  },
  addButton: {
    alignSelf: "flex-start",
    backgroundColor: tokens.colorBrandBackground,
    ...shorthands.border("0", "none"),
    ...shorthands.borderRadius(tokens.borderRadiusMedium),
    ...shorthands.padding("4px", "14px"),
    fontSize: "0.7rem",
    cursor: "pointer",
    color: tokens.colorNeutralForegroundOnBrand,
    fontWeight: tokens.fontWeightMedium,
    minWidth: "0",
    minHeight: "0",
    height: "auto",
    "&:hover": {
      backgroundColor: tokens.colorBrandBackgroundHover,
      boxShadow: tokens.shadow4
    },
    "&:disabled": {
      backgroundColor: tokens.colorNeutralBackground3,
      color: tokens.colorNeutralForeground4,
      cursor: "not-allowed"
    }
  },
  clearButton: {
    backgroundColor: tokens.colorTransparentBackground,
    ...shorthands.border("0", "none"),
    ...shorthands.borderRadius(tokens.borderRadiusMedium),
    ...shorthands.padding("4px", "10px"),
    fontSize: "0.7rem",
    cursor: "pointer",
    color: tokens.colorNeutralForeground2,
    fontWeight: tokens.fontWeightMedium,
    minWidth: "0",
    minHeight: "0",
    height: "auto",
    "&:hover": {
      backgroundColor: tokens.colorNeutralBackground3,
      color: tokens.colorNeutralForeground1
    },
    "&:disabled": {
      color: tokens.colorNeutralForeground4,
      cursor: "not-allowed"
    }
  }
});
