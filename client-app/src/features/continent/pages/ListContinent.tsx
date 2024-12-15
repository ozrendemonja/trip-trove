import { IColumn, Link, Selection, Stack } from "@fluentui/react";
import { useBoolean } from '@fluentui/react-hooks';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import ListElement from "../../../shared/ListElement/ListElement";
import EditProperty from "../../../shared/ListElement/ui/EditProperty/EditProperty";
import { deleteRows } from "../domain/continent";
import { Continent } from "../domain/continent.types";
import { ContinentListCustomizer } from '../domain/ContinentListCustomizer';
import { getContinents } from "../infra/managerApi";
import { listHeader, onRenderWhenNoMoreItems } from "./ListContinent.config";
import { useClasses } from "./ListContinent.styles";

const onRenderItemColumn = (continent?: Continent, index?: number, column?: IColumn): JSX.Element | string | number => {
    const classes = useClasses();
    if (column?.key === 'name') {
        return (
            <Stack tokens={{ childrenGap: 15 }} horizontal={true}>
                <Link className={classes.linkField} href={`https://www.google.com/search?q=${continent.name}`} target="_blank" rel="noopener" underline>
                    {continent?.name}
                </Link>
                <EditProperty text={continent?.name} />
            </ Stack>
        );
    }
    return item[column.key as keyof Continent];
};

export const ContinentList: React.FunctionComponent = () => {
    const [items, setItems] = useState(undefined);
    const [columns, setColumns] = useState(undefined);
    const [isLoading, setIsLoading] = useState(true);
    const [reloadData, { toggle: toggleReloadData }] = useBoolean(true);
    const navigate = useNavigate();

    useEffect(() => {
        getContinents()
            .then(data => {
                setIsLoading(true);
                new ContinentListCustomizer(data, setItems, setColumns).createColumns();
                setIsLoading(false);
            })
    }, [reloadData]);

    return (
        <>
            {isLoading && <p>Loading...</p>}
            {!isLoading &&
                <ListElement
                    items={items}
                    columns={columns}
                    listHeader={listHeader}
                    addRowOptions={{
                        text: "Add new continent",
                        onAddRow: () => navigate("/add-continent"),
                    }}
                    deleteRowOptions={{
                        text: "Delete continent",
                        onDeleteRow: async (selection: Selection<Continent>) => {
                            await deleteRows(selection.getSelection());
                            toggleReloadData();
                        }
                    }}
                    onRenderMissingItem={onRenderWhenNoMoreItems}
                    onRenderItemColumn={onRenderItemColumn}
                    selectedItemName={(selection: Selection<Continent>) => selection.getSelection()[0].name}
                />
            }
        </>
    );
}

export default ContinentList;