import { createListItems, IExampleItem } from "@fluentui/example-data";
import { buildColumns, ColumnActionsMode, IColumn, Link, mergeStyleSets, Selection } from "@fluentui/react";
import { useEffect, useState } from "react";
import ListElement from "../../../shared/ListElement/ListElement";
import { ListHeaderProps } from "../../../shared/ListElement/ui/ListHeader/ListHeader.types";
import { ListElementCustomizer } from "../../../shared/ListElement/ListElement.types";

const classNames = mergeStyleSets({
    linkField: {
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        maxWidth: '100%',
    }
});

// Button behaviour
const onAddRow = (): void => {
    alert("Add continent 222");
};
const onDeleteRow = (selection: Selection): void => {
    console.log(JSON.stringify(selection))
    if (selection.getSelectedCount() > 0) {
        alert("Deleted continent(s) " + selection.getSelectedCount());
    }
};

// Load new data
const onRenderMissingItem = (index?: number, rowProps?: IDetailsRowProps) => {
    return null;
}

// Search bar
const onFilter = (event?: React.ChangeEvent<HTMLInputElement>, text?: string): void => {
    // this.setState({
    //     sortedItems: text ? this._allItems.filter(i => i.color.toLowerCase().indexOf(text) > -1) : this._allItems,
    // });
};

// TODO Move constant
const listHeader: ListHeaderProps = {
    text: "All continents",
    onSearchTyped: onFilter
};

// Adding elements beside the text in the column ?????
const onRenderItemColumn = (item?: IExampleItem, index?: number, column?: IColumn): JSX.Element | string | number => {
    // if (column?.key === 'thumbnail') {
    //     return <img src={item?.thumbnail} />;
    //     // return <Link data-selection-invoke={true}>{"Edit"}</Link>;
    // } else if (column?.key === 'name') {
    //     return <EditProperty text={item?.name} />;
    // } else if (column?.key === 'width') {
    //     return <EditProperty text={item?.width} isOptional={true} />;
    // } else if (column?.key === 'shape') {
    //     return <CheckboxButton />;
    // } else if (column?.key === 'location') {
    //     return <DatePickerMy />
    // }
    return item[column.key as keyof IExampleItem];
};


class ContinentListCustomizer extends ListElementCustomizer {
    constructor(items: IExampleItem[], callback: (items: IExampleItem[]) => void, callback2: (columns: IColumn[]) => void) {
        super(items, callback, callback2);
        this.callback(items);
    }

    private setSetupForSortIcon = (column: IColumn): IColumn => {
        const result = Object.assign({}, column);
        if (result.name) {
            result.showSortIconWhenUnsorted = true;
            result.isCollapsible = true; //?
            result.isMultiline = true;
            result.minWidth = 100;
        }
        return result;
    }
    private setGoogleLinkOnName = (column: IColumn): IColumn => {
        const result = Object.assign({}, column);

        result.ariaLabel = `Operations for ${column.name}`;
        result.isMultiline = false;
        result.minWidth = 100;
        result.onRender = (item: IExampleItem) => (
            <Link className={classNames.linkField} href={`https://www.google.com/search?q=${item.key}`} target="_blank" rel="noopener" underline>
                {item.key}
            </Link>
        );
        result.isResizable = true;

        return result;
    }

    setThumbnail = (columns: IColumn[]) => {
        const thumbnailColumn = columns.filter(column => column.name === 'thumbnail')[0];

        // Special case one column's definition.
        thumbnailColumn.name = '';
        thumbnailColumn.maxWidth = 50;
        thumbnailColumn.ariaLabel = 'Thumbnail';
        thumbnailColumn.onColumnClick = undefined;
    }
    setSortIconWhenUnsorted = (columns: IColumn[]): void => {
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
    setProperData = (columns: IColumn[]) => {
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
    public createColumns = (): void => {
        // const columns = buildColumns(this.items, true, this.onColumnClick)
        //     .map(column => this.setSetupForSortIcon(column))
        //     .map(column => this.setGoogleLinkOnName(column));

        const columns = buildColumns(this.items, true, this.onColumnClick)
        this.setThumbnail(columns);
        this.setSortIconWhenUnsorted(columns);
        this.setProperData(columns);

        this.columns = columns;
        this.callback2(this.columns);
    }
}


export const ContinentList: React.FunctionComponent = () => {
    const [items, setItems] = useState({} as IExampleItem[]);
    const [columns, setColumns] = useState(undefined);

    useEffect(() => {
        const aaa = new ContinentListCustomizer(createListItems(15), setItems, setColumns);
        aaa.createColumns();
    }, []);

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

export default ContinentList;