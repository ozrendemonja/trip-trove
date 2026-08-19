import { makeStyles, shorthands, tokens } from "@fluentui/react-components";

export const useDeleteDialogStyles = makeStyles({
  commandBar: {
    display: "flex",
    gap: tokens.spacingHorizontalXS
  },
  deleteButton: {
    color: tokens.colorPaletteRedForeground1,
    ...shorthands.borderColor(tokens.colorPaletteRedForeground1),
    transitionProperty: "none !important",
    "& svg": {
      color: tokens.colorPaletteRedForeground1
    },
    "&:hover, &:focus-visible": {
      backgroundColor: `${tokens.colorPaletteRedForeground1} !important`,
      ...shorthands.borderColor(tokens.colorPaletteRedForeground1),
      color: `${tokens.colorNeutralForegroundStaticInverted} !important`,
      "& svg": {
        color: `${tokens.colorNeutralForegroundStaticInverted} !important`
      }
    },
    "&:disabled": {
      color: tokens.colorPaletteRedForeground1,
      ...shorthands.borderColor(tokens.colorPaletteRedForeground1),
      opacity: 0.4,
      "& svg": {
        color: tokens.colorPaletteRedForeground1
      }
    }
  }
});

export const useConfirmDeleteDialogStyles = makeStyles({
  deleteButton: {
    backgroundColor: tokens.colorPaletteRedForeground1,
    ...shorthands.borderColor(tokens.colorPaletteRedForeground1),
    color: tokens.colorNeutralForegroundStaticInverted,
    "&:hover, &:active": {
      backgroundColor: tokens.colorPaletteRedForeground1,
      ...shorthands.borderColor(tokens.colorPaletteRedForeground1),
      color: tokens.colorNeutralForegroundStaticInverted
    }
  }
});
