import React, {useCallback, useState } from 'react';
import { AsyncTypeahead } from 'react-bootstrap-typeahead';

const BASE_URI = 'http://192.168.11.50:3000';
const SEARCH_URI = BASE_URI+'/items';
const ITEM_REGEX = new RegExp("\\d{6}");

export default function MyTypeahead(props) {
    const [isLoading, setIsLoading] = useState(false);
    const [options, setOptions] = useState([]);

    const handleSearch = useCallback((query) => {
        setIsLoading(true);
        const searchEndpoint = ITEM_REGEX.test(query) ?
                               `${SEARCH_URI}/${query}` :
                               `${SEARCH_URI}?q=${query}` 
        fetch(searchEndpoint)
            .then((resp) => resp.json())
            .then((items) => {
                const options = items;
                setOptions(options);
                setIsLoading(false);
            });
    }, []);
    const handleSelected = (selected) => {
        props.handleSelected(selected);
    }
    return (
        <AsyncTypeahead
            id="async-example"
            ref={props.forwardRef}
            isLoading={isLoading}
            clearButton
            labelKey={(option) => `${option.itemname}`}
            minLength={3}
            onSearch={handleSearch}
            options={options}
            placeholder="Search on item name or code ..."
            renderMenuItemChildren={(option, props) => (
                <div>
                    <span style={{whiteSpace:"initial"}}><div style={{fontWeight:"bold"}}>{option.itemcode}</div> - {option.itemname} - {option.onhand}</span>
                </div>
            )}
            filterBy={(option, props) => option}
            onChange={handleSelected}
        />
    );
};