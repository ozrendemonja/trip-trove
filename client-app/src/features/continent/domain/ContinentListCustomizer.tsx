import { buildColumns, IColumn, Link, mergeStyleSets } from "@fluentui/react";
import { ListElementCustomizer } from "../../../shared/ListElement/ListElement.types";
import { Continent } from "./continent.types";

const classNames = mergeStyleSets({
    linkField: {
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        maxWidth: '100%',
    }
});

export class ContinentListCustomizer extends ListElementCustomizer<Continent> {
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
            <Link className={classNames.linkField} href={`https://www.google.com/search?q=${continent.name}`
            } target="_blank" rel="noopener" underline>
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
