import { Dropdown, IDropdownOption, IDropdownStyles, mergeStyleSets, SearchBox, Text } from "@fluentui/react";
import { ListHeaderProps } from "../../features/continent/ui/ListHeader/ListHeader.types";

const classNames = mergeStyleSets({
    root: {
        display: 'flex',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
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
        width: "200px",
        selectors: {
            ".ms-Dropdown-title": {
                backgroundColor: "#F9FBFF",
                borderRadius: "10px",
                borderColor: 'transparent',
            }
        }
    },
    dropdownSelectedOption: {
        fontWeight: "600"
    }
});

const sortOptions: IDropdownOption[] = [
    { key: 'newest', text: 'Newest', selected: true },
    { key: 'oldest', text: 'Oldest' },
];

const ListHeader: React.FunctionComponent<ListHeaderProps> = props => {
    const onRenderTitle = (options?: IDropdownOption[]): JSX.Element => {
        const selectedOption = options;
        return (
            <Text as={"span"} className={classNames.dropdownSelectedOption}>
                <Text as={"span"}>Sort by: </Text>
                {selectedOption ? selectedOption[0].text : ""}
            </Text>
        );
    };

    return (
        <div className={classNames.root}>
            <Text as="h1" className={classNames.header}>{props.text}</Text>
            <SearchBox className={classNames.searchBox} placeholder="Search" onChange={props.onSearchTyped} />
            <Dropdown
                className={classNames.dropdown}
                placeholder="Sort by:"
                options={sortOptions}
                onRenderTitle={(options) => onRenderTitle(options)}
            />
        </div>
    );
};

export default ListHeader;