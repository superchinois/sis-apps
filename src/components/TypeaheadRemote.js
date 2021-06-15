import React, {useCallback, useState } from 'react';
import { AsyncTypeahead } from 'react-bootstrap-typeahead';

/**
 * 
 * @param {forwardRef, searchEndpoint, handleSelected, placeholder} props 
 */
export default function TypeaheadRemote(props) {
    const [isLoading, setIsLoading] = useState(false);
    const [options, setOptions] = useState([]);

    const handleSearch = useCallback((query) => {
        setIsLoading(true);
        let  searchEndpoint = props.searchEndpoint(query); 
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
            labelKey={props.labelKey}
            minLength={3}
            onSearch={handleSearch}
            options={options}
            placeholder={props.placeholder}
            renderMenuItemChildren={props.renderMenuItem}
            filterBy={(option, props) => option}
            onChange={handleSelected}
            delay={400}
            onKeyDown={props.onKeyDown}
            clearButton={props.clearButton}
            useCache={props.useCache}
        />
    );
};