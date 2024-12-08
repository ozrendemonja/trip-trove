import React from 'react';
import { IExampleItem } from "@fluentui/example-data";
import { buildColumns, IColumn, Link, mergeStyleSets, Selection } from "@fluentui/react";
import { useEffect, useState } from "react";
import ListElement from "../../../shared/ListElement/ListElement";
import { ListElementCustomizer } from "../../../shared/ListElement/ListElement.types";
import { ListHeaderProps } from "../../../shared/ListElement/ui/ListHeader/ListHeader.types";
import { getContinents } from "../infra/managerApi";
import { Continent } from "../domain/continent.types";

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
    alert("Deleted continent(s) " + selection.getKey());
    if (selection.getSelectedCount() > 0) {
        // alert("Deleted continent(s) " + selection.getSelectedCount());
    }
};

// OK => Load new data
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


class ContinentListCustomizer extends ListElementCustomizer<Continent> {
    constructor(items: Continent[], callback: (items: Continent[]) => void, callback2: (columns: IColumn[]) => void) {
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
        result.onRender = (continent: Continent) => (
            <Link className={classNames.linkField} href={`https://www.google.com/search?q=${continent.name}`} target="_blank" rel="noopener" underline>
                {continent.name}
            </Link>
        );
        result.isResizable = true;

        return result;
    }

    public createColumns = (): void => {
        const columns = buildColumns(this.items, true, this.onColumnClick)
            .map(column => this.setSetupForSortIcon(column))
            .map(column => this.setGoogleLinkOnName(column));

        this.columns = columns;
        this.callback2(this.columns);
    }
}


export const ContinentList: React.FunctionComponent = () => {
    const [items, setItems] = useState(undefined);
    const [columns, setColumns] = useState(undefined);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        getContinents()
            .then(data => {
                setIsLoading(false);
                const aaa = new ContinentListCustomizer(data, setItems, setColumns);
                aaa.createColumns();
            })
    }, []);

    return (
        <div>
            {isLoading && <p>Loading...</p>}
            {!isLoading &&
                <ListElement
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
        </div>
    );
}

export default ContinentList;
