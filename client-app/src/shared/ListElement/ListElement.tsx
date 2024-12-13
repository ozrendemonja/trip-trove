import { initializeIcons } from '@fluentui/react';
import {
    CheckboxVisibility,
    ConstrainMode,
    DetailsList,
    DetailsListLayoutMode,
    Selection,
    SelectionMode
} from '@fluentui/react/lib/DetailsList';
import React, { useState } from 'react';
import { useClasses } from './ListElement.styles';
import { ListElementProps } from './ListElement.types';
import DeleteDialog from './ui/DeleteDialog/DeleteDialog';
import ListHeader from './ui/ListHeader/ListHeader';


initializeIcons();

export const ListElement: React.FunctionComponent<ListElementProps<T>> = props => {
    const classes = useClasses();
    const sortedItems = props.items;
    const columns = props.columns;

    const [haveSelectedItem, setHaveSelectedItem] = useState(true);
    const [selectedItemName, setSelectedItemName] = useState("");
    const onSelectedItemChange = () => {
        setHaveSelectedItem(selection.getSelectedCount() == 0);
        setSelectedItemName(props.selectedItemName(selection));
    }
    const selection = React.useMemo(
        () => {
            const selection = new Selection({ onSelectionChanged: onSelectedItemChange });
            selection.setItems(sortedItems, false);
            return selection;
        },
        []
    );

    return (
        <div className={classes.root}>
            <ListHeader {...props.listHeader} />
            <DeleteDialog selectedItem={{ haveSelectedItem: haveSelectedItem, name: selectedItemName }} addRowOptions={{ text: props.addRowText, onAddRow: () => { } }} deleteRowOptions={{ text: props.onDeleteRowText, onDeleteRow: () => props.onDeleteRow(selection) }} />
            <DetailsList
                className={classes.listBody}
                setKey={`${props.listHeader.text}-DetailsList`}
                items={sortedItems ?? []}
                selection={selection}
                selectionPreservedOnEmptyClick={true}
                enterModalSelectionOnTouch={true}
                columns={columns}
                checkboxVisibility={CheckboxVisibility.onHover}
                layoutMode={DetailsListLayoutMode.justified}
                isHeaderVisible={true}
                selectionMode={SelectionMode.single}
                constrainMode={ConstrainMode.horizontalConstrained}
                selectionZoneProps={{
                    selection: selection,
                    disableAutoSelectOnInputElements: true,
                    selectionMode: SelectionMode.single,
                }}
                ariaLabelForListHeader="Column headers. Click to sort."
                ariaLabelForSelectAllCheckbox='Select all rows'
                ariaLabelForSelectionColumn="Toggle selection TEST"
                checkButtonAriaLabel="select row"
                onRenderMissingItem={props.onRenderMissingItem}
                onRenderItemColumn={props.onRenderItemColumn}
                ariaLabelForGrid="Item details"
            />
        </div >
    );
}

export default ListElement;