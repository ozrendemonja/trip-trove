import React from 'react';
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
    const selection = React.useMemo(
        () => {
            const selection = new Selection();
            selection.setItems(sortedItems, false);
            return selection;
        },
        []
    );

    return (
        <div className={classNames.root}>
            <ListHeader {...props.listHeader} />
            <CommandBar items={getCommandItems(selection, props.onAddRow, props.addRowText, props.onDeleteRow, props.onDeleteRowText)} />
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
                selectionMode={SelectionMode.multiple}
                constrainMode={ConstrainMode.horizontalConstrained}
                selectionZoneProps={{
                    selection: selection,
                    disableAutoSelectOnInputElements: true,
                    selectionMode: SelectionMode.multiple,
                }}
                ariaLabelForListHeader="Column headers. Click to sort."
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