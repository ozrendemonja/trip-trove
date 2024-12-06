import { createListItems, IExampleItem } from '@fluentui/example-data';
import { IconButton, IListProps, initializeIcons, ShimmeredDetailsList, Stack } from '@fluentui/react';
import { CommandBar } from '@fluentui/react/lib/CommandBar';
import {
    IContextualMenuItem,
    IContextualMenuProps
} from '@fluentui/react/lib/ContextualMenu';
import {
    buildColumns,
    CheckboxVisibility,
    ColumnActionsMode,
    ConstrainMode,
    DetailsList,
    DetailsListLayoutMode,
    IColumn,
    IDetailsRowProps,
    Selection,
    SelectionMode
} from '@fluentui/react/lib/DetailsList';
import { Link } from '@fluentui/react/lib/Link';
import { getTheme, mergeStyleSets } from '@fluentui/react/lib/Styling';
import { Text } from '@fluentui/react/lib/Text';
import * as React from 'react';
import DatePickerMy from '../../shared/ListElement/ui/DatePickerMy/DatePickerMy';
import ListHeader from '../../shared/ListElement/ui/ListHeader/ListHeader';
import { ListHeaderProps } from '../../shared/ListElement/ui/ListHeader/ListHeader.types';
import EditProperty from '../../shared/ListElement/ui/EditProperty/EditProperty';
import CheckboxButton from '../../shared/ListElement/ui/CheckboxButton/CheckboxButton';
import ListElement from '../../shared/ListElement/ListElement';

const theme = getTheme();
const headerDividerClass = 'DetailsListAdvancedExample-divider';
const classNames = mergeStyleSets({
    commandBarText: {
        padding: '12px',
    },
    commandBarWrapper: {
        display: 'flex',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
    },
    headerDivider: {
        display: 'inline-block',
        height: '100%',
    },
    headerDividerBar: [
        {
            display: 'none',
            background: theme.palette.themePrimary,
            position: 'absolute',
            top: 16,
            bottom: 0,
            width: '1px',
            zIndex: 5,
        },
        headerDividerClass,
    ],
    linkField: {
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        maxWidth: '100%',
    },
    root: {
        marginLeft: "100px",
        padding: '12px',
        maxHeight: "1200px",
        maxWidth: "1200px",
        borderRadius: "30px",
        background: "white",
        selectors: {
            [`.${headerDividerClass}:hover + .${headerDividerClass}`]: {
                display: 'inline',
            },
        },
    },
    rootAAA: {
        maxHeight: "600px",
        maxWidth: "1200px",
        selectors: {
            "& .ms-Check-circle": {
                borderRadius: "50%"
            }
        },
    },
    header: {
        fontSize: "30px",
        marginLeft: "25px",
        marginTop: "5px",
        fontWeight: "600"
    },
    searchBox: {
        marginTop: "25px",
        backgroundColor: "#F9FBFF",
        borderRadius: "10px",
        borderColor: "transparent",
        width: "300px"
    },
    dropdown: {
        marginTop: "25px",
        borderColor: "transparent",
        width: "200px"
    }
});

export interface IDetailsListAdvancedExampleState {
    columns: IColumn[];
    sortedItems: IExampleItem[];
    contextualMenuProps?: IContextualMenuProps;
    items: IExampleItem[];
}

initializeIcons();


//-----------------------------------------------------
const onAddRow = (): void => {
    alert("Add continent");
};
const onDeleteRow = (selection: Selection): void => {
    alert("Deleted continent(s) " + selection.getSelectedCount());
    if (selection.getSelectedCount() > 0) {
        alert("Deleted continent(s) " + selection.getSelectedCount());
    }
};
const getCommandItems = (selection: Selection): IContextualMenuItem[] => {
    return [
        {
            key: 'addRow',
            text: 'Add continent',
            iconProps: { iconName: 'Add' },
            onClick: onAddRow,
        },
        {
            key: 'deleteRow',
            text: 'Delete continent',
            iconProps: { iconName: 'Delete' },
            onClick: () => onDeleteRow(selection),
            disabled: selection.getSelectedCount() < 1
        },
    ];
};


//-----------------------------------------------------
const setThumbnail = (columns: IColumn[]) => {
    const thumbnailColumn = columns.filter(column => column.name === 'thumbnail')[0];

    // Special case one column's definition.
    thumbnailColumn.name = '';
    thumbnailColumn.maxWidth = 50;
    thumbnailColumn.ariaLabel = 'Thumbnail';
    thumbnailColumn.onColumnClick = undefined;
}
const setSortIconWhenUnsorted = (columns: IColumn[]): void => {
    // Indicate that all columns except thumbnail column can be sorted,
    // and only the description colum should disappear at small screen sizes
    columns.forEach((column: IColumn) => {
        if (column.name) {
            column.showSortIconWhenUnsorted = true;
            column.isCollapsible = column.name === 'description';
            column.isMultiline = true;
            column.minWidth = 200;
        }
    });
}
const setProperData = (columns: IColumn[]) => {
    columns.forEach(column => {
        column.ariaLabel = `Operations for ${column.name}`;
        if (column.key === 'description') {
            column.isMultiline = true;
            column.minWidth = 300;
        } else if (column.key === 'key') {
            column.columnActionsMode = ColumnActionsMode.disabled;
            column.onRender = (item: IExampleItem) => (
                <Link className={classNames.linkField} href="https://microsoft.com" target="_blank" rel="noopener" underline>
                    {item.key}
                </Link>
            );
            column.minWidth = 90;
            // column.maxWidth = 90;
            column.isResizable = true;
        }
    });
}
function copyAndSort<T>(items: T[], columnKey: string, isSortedDescending?: boolean): T[] {
    const key = columnKey as keyof T;
    return items.slice(0).sort((a: T, b: T) => ((isSortedDescending ? a[key] < b[key] : a[key] > b[key]) ? 1 : -1));
}
const onColumnClick = (event: React.MouseEvent<HTMLElement>, column: IColumn): void => {
    // const { columns } = state!;
    // let { sortedItems } = state!;
    // let isSortedDescending = column.isSortedDescending;

    // // If we've sorted this column, flip it.
    // if (column.isSorted) {
    //     isSortedDescending = !isSortedDescending;
    // }

    // // Sort the items.
    // sortedItems = copyAndSort(sortedItems, column.fieldName!, isSortedDescending);

    // // Reset the items and columns to match the state.
    // setState({
    //     sortedItems,
    //     columns: columns.map(col => {
    //         col.isSorted = col.key === column.key;

    //         if (col.isSorted) {
    //             col.isSortedDescending = isSortedDescending;
    //         }

    //         return col;
    //     }),
    // });
};
const buildColumnsMy = (items: IExampleItem[]): any => {
    const columns = buildColumns(items, true, (event: React.MouseEvent<HTMLElement>, column: IColumn) => onColumnClick(event, column));
    setThumbnail(columns)
    setSortIconWhenUnsorted(columns);
    setProperData(columns)

    return columns;
}


//-----------------------------------------------
// const shimmerColumns = (): IColumn[] => {
//     const currentItems = createListItems(1);
//     const columns: IColumn[] = buildColumnsMy(currentItems);
//     for (const column of columns) {
//         if (column.key === 'thumbnail') {
//             column.name = 'FileType';
//             column.minWidth = 16;
//             column.maxWidth = 16;
//             column.isIconOnly = true;
//             column.iconName = 'Page';
//             break;
//         }
//     }
//     return columns;
// };
const shimmeredDetailsListProps: IListProps = {
    renderedWindowsAhead: 0,
    renderedWindowsBehind: 0,
};


//----------------------------------------------------
const onFilter = (event?: React.ChangeEvent<HTMLInputElement>, text?: string): void => {
    // this.setState({
    //     sortedItems: text ? this._allItems.filter(i => i.color.toLowerCase().indexOf(text) > -1) : this._allItems,
    // });
};


//-------------------------------------------------
const onRenderItemColumn = (item?: IExampleItem, index?: number, column?: IColumn): JSX.Element | string | number => {
    if (column?.key === 'thumbnail') {
        return <img src={item?.thumbnail} />;
        // return <Link data-selection-invoke={true}>{"Edit"}</Link>;
    } else if (column?.key === 'name') {
        return <EditProperty text={item?.name} />;
    } else if (column?.key === 'width') {
        return <EditProperty text={item?.width} isOptional={true} />;
    } else if (column?.key === 'shape') {
        return <CheckboxButton />;
    } else if (column?.key === 'location') {
        return <DatePickerMy />
    }
    return item[column.key as keyof IExampleItem];
};


//--------------------------------------------------
const onRenderMissingItem = (index?: number, rowProps?: IDetailsRowProps) => {
    return null;
}


// Moved export
const DetailsListAdvancedExampleAAA: React.FunctionComponent = () => {
    const items = createListItems(10);
    const sortedItems = items;
    const columns = buildColumnsMy(items);
    const selection = new Selection();
    selection.setItems(items, false);

    // TODO Move constant
    const listHeader: ListHeaderProps = {
        text: "All continents",
        onSearchTyped: onFilter
    };

    return <ListElement
        items={items}
        columns={columns}
        listHeader={listHeader}
        onAddRow={onAddRow}
        addRowText="Add continent"
        onDeleteRow={onDeleteRow}
        onDeleteRowText="Delete continent"
        onRenderMissingItem={onRenderMissingItem}
        onRenderItemColumn={onRenderItemColumn}
    />
}

export default DetailsListAdvancedExampleAAA;