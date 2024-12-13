export interface DeleteDialogProps {
    selectedItem: {
        haveSelectedItem: boolean;
        name: string;
    }
    addRowOptions: AddRowOptionsProps;
    deleteRowOptions: DeleteRowOptionsProps;
};

export interface AddRowOptionsProps {
    text: string;
    onAddRow: () => void;
}

export interface DeleteRowOptionsProps {
    text: string;
    onDeleteRow: () => void;
}