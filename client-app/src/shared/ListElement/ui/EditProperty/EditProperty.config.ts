import { ContextualMenu, DialogType, IDialogContentProps, IDragOptions } from "@fluentui/react";

export const useDragOptions = (): IDragOptions => {
    return {
        moveMenuItemText: 'Move',
        closeMenuItemText: 'Close',
        menu: ContextualMenu,
        keepInBounds: true,
    }
};
