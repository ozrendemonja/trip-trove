import { IDetailsRowProps } from "@fluentui/react";
import { ListHeaderProps } from "../../../shared/ListElement/ui/ListHeader/ListHeader.types";

export const onRenderWhenNoMoreItems = (index?: number, rowProps?: IDetailsRowProps) => {
    return null;
}

const onSearchKeyStroke = (event?: React.ChangeEvent<HTMLInputElement>, text?: string): void => {
    // this.setState({
    //     sortedItems: text ? this._allItems.filter(i => i.color.toLowerCase().indexOf(text) > -1) : this._allItems,
    // });
};

export const listHeader: ListHeaderProps = {
    text: "All continents",
    onSearchTyped: onSearchKeyStroke
};

