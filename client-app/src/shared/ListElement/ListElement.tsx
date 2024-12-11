import React, { useState } from 'react';
import { initializeIcons } from '@fluentui/react';
import { CommandBar } from '@fluentui/react/lib/CommandBar';
import {
    IContextualMenuItem
} from '@fluentui/react/lib/ContextualMenu';
import {
    CheckboxVisibility,
    ConstrainMode,
    DetailsList,
    DetailsListLayoutMode,
    Selection,
    SelectionMode
} from '@fluentui/react/lib/DetailsList';
import { useClasses } from './ListElement.styles';
import { ListElementProps } from './ListElement.types';
import ListHeader from './ui/ListHeader/ListHeader';
import DeleteDialog from './ui/DeleteDialog/DeleteDialog';



initializeIcons();


const getCommandItems = (selection: Selection, onAddRow: any, addRowText: string, onDeleteRow: any, onDeleteRowText: string): IContextualMenuItem[] => {
    return [
        {
            key: 'addRow',
            text: addRowText,
            iconProps: { iconName: 'Add' },
            onClick: onAddRow,
        },
        {
            key: 'deleteRow',
            text: onDeleteRowText,
            iconProps: { iconName: 'Delete' },
            onClick: () => onDeleteRow(selection),
            // disabled: selection.getSelectedCount() < 1
        },
    ];
};

export const ListElement: React.FunctionComponent<ListElementProps> = props => {
    const classNames = useClasses();
    const sortedItems = props.items;
    const columns = props.columns;
    const [haveSelectedItem, setHaveSelectedItem] = useState(true);
    const test123 = () => {
        const indices = selection.getSelectedIndices();
        setHaveSelectedItem(indices.length == 0);
    }

    const selection = React.useMemo(
        () => {
            const selection = new Selection({ onSelectionChanged: test123 });
            selection.setItems(sortedItems, false);
            return selection;
        },
        []
    );

    return (
        <div className={classNames.root}>
            <ListHeader {...props.listHeader} />
            <DeleteDialog addRowText={props.addRowText} onDeleteRowText={props.onDeleteRowText} haveSelectedItem={haveSelectedItem} onDeleteRow={() => props.onDeleteRow(selection)} />
            <DetailsList
                className={classNames.listBody}
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