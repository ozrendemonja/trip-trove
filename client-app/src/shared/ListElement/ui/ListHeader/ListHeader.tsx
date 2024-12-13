import React from 'react';
import { Dropdown, IDropdownOption, IDropdownStyles, mergeStyleSets, SearchBox, Text } from "@fluentui/react";
import { ListHeaderProps } from './ListHeader.types';
import useClasses from './ListHeader.styles';

const sortOptions: IDropdownOption[] = [
    { key: 'newest', text: 'Newest', selected: true },
    { key: 'oldest', text: 'Oldest' },
];

const ListHeader: React.FunctionComponent<ListHeaderProps> = props => {
    const classes = useClasses();
    const onRenderTitle = (options?: IDropdownOption[]): JSX.Element => {
        const selectedOption = options;
        return (
            <Text as={"span"} className={classes.dropdownSelectedOption}>
                <Text as={"span"}>Sort by: </Text>
                {selectedOption ? selectedOption[0].text : ""}
            </Text>
        );
    };

    return (
        <div className={classes.root}>
            <Text as="h1" className={classes.header}>{props.text}</Text>
            <SearchBox className={classes.searchBox} placeholder="Search" onChange={props.onSearchTyped} />
            <Dropdown
                className={classes.dropdown}
                placeholder="Sort by:"
                options={sortOptions}
                onRenderTitle={(options) => onRenderTitle(options)}
            />
        </div>
    );
};

export default ListHeader;