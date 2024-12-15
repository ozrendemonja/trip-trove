import { IColumn, IDetailsRowProps, Selection } from "@fluentui/react";
import { useBoolean } from '@fluentui/react-hooks';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import ListElement from "../../../shared/ListElement/ListElement";
import { ListHeaderProps } from "../../../shared/ListElement/ui/ListHeader/ListHeader.types";
import { Continent } from "../domain/continent.types";
import { ContinentListCustomizer } from '../domain/ContinentListCustomizer';
import { deleteContinentWithName, getContinents } from "../infra/managerApi";
import EditProperty from "../../../shared/ListElement/ui/EditProperty/EditProperty";


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
const onRenderItemColumn = (item?: Continent, index?: number, column?: IColumn): JSX.Element | string | number => {
    console.log("------------------------------");
    console.log(JSON.stringify(column));
    if (column?.key === 'name') {
        return <EditProperty text={item?.name} />;
    }
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
    return item[column.key as keyof Continent];
};

// Continent commands handling
const onDeleteRow = async (continents: Continent[]): Promise<void> => {
    for (const continent of continents) {
        await deleteContinentWithName(continent.name);
    }
};

export const ContinentList: React.FunctionComponent = props => {
    const [items, setItems] = useState(undefined);
    const [columns, setColumns] = useState(undefined);
    const [isLoading, setIsLoading] = useState(true);
    const [reloadData, { toggle: toggleReloadData }] = useBoolean(true);
    let continentListData: ContinentListCustomizer;
    const navigate = useNavigate();

    useEffect(() => {
        getContinents()
            .then(data => {
                setIsLoading(true);
                continentListData = new ContinentListCustomizer(data, setItems, setColumns);
                continentListData.createColumns();
                setIsLoading(false);
            })
    }, [reloadData]);

    return (
        <div>
            {isLoading && <p>Loading...</p>}
            {!isLoading &&
                <ListElement
                    items={items}
                    columns={columns}
                    listHeader={listHeader}
                    onAddRow={props.onAddRow}
                    addRowOptions={{
                        text: "Add new continent",
                        onAddRow: () => navigate("/add-continent"),
                    }}
                    deleteRowOptions={{
                        text: "Delete continent",
                        onDeleteRow: async (selection: Selection<Continent>) => {
                            const continents = selection.getSelection();
                            await onDeleteRow(continents);
                            toggleReloadData();
                        }
                    }}
                    onRenderMissingItem={onRenderMissingItem}
                    onRenderItemColumn={onRenderItemColumn}
                    selectedItemName={(selection: Selection<Continent>) => {
                        return selection.getSelection()[0].name;
                    }}
                />
            }
        </div>
    );
}

export default ContinentList;
