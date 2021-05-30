import React, { useState } from 'react';
import Alert from 'react-bootstrap/Alert';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import Col from 'react-bootstrap/Col';
import Row from 'react-bootstrap/Row'
import Spinner from 'react-bootstrap/Spinner'
import Container from 'react-bootstrap/Container'
import TypeaheadRemote from './TypeaheadRemote';

import ConfigApi from "../config.json";
import table_helpers from "../utils/bootstrap_table";
import react_helpers from "../utils/react_helpers";
const BASE_URL = ConfigApi.API_URL;
const SEARCH_URL = `${BASE_URL}/suppliers?search=`;

const fetchData = (url, outputName,callback)=>{
    let requestOptions = {
        method: "POST",
    };
    fetch(url, requestOptions)
    .then(response => response.blob()).then(blob => {
        // 2. Create blob link to download
        const url = window.URL.createObjectURL(new Blob([blob]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `${outputName}.xlsx`);  // 3. Append to html page
        document.body.appendChild(link);  // 4. Force download
        link.click();  // 5. Clean up and remove the link
        link.parentNode.removeChild(link);
        callback();
    })
};

export default function CadencierForm(props) {
    const remote_url_fn=props.remote_url_fn;
    const typeaheadRef = React.createRef();
    const [selected, setSelected] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const textPlaceholder = "Entrer un nom de fournisseur...";

    const resetStates = () => {
        setSelected(null);
        setIsLoading(false);
    };
    /**
     * Callback when a supplier is selected 
     * @param {item selected from the supplier search field} selected 
     */
    const handleSelected = (selected) => {
        let selected_supplier = selected[0];
        setSelected(selected_supplier);
        if (selected.length > 0) {
            // get data on selected supplier
        }
        else {
            // Clean state at supplier change
            resetStates();
        }
    }
    const supplierSearchEndpoint = query => `${SEARCH_URL}${query}`;
    const labelKey = option => `${option.cardname}`;
    const renderMenuItem = (option, props) => (
        <div>
            <span style={{ whiteSpace: "initial" }}><div style={{ fontWeight: "bold" }}>{option.cardcode}</div> - {option.cardname}</span>
        </div>
    );
    const handleSubmit = (event) => {
        let url = remote_url_fn(selected.cardcode);
        setIsLoading(true);
        fetchData(url, selected.cardcode, () => setIsLoading(false))
        event.preventDefault();
    };
    const renderSupplierDetails = (selected) => {
        return (
            <Container fluid>
                <Row className="mt-2">
                    <Col>
                        <Form onSubmit={handleSubmit}>
                            <Form.Row>
                                <Col>
                                {table_helpers.buildGroupDetails(["cardcode", "Cardcode", "text", "Cardcode placeholder", selected.cardcode,true, undefined, undefined, "-1"])}
                                </Col>
                            </Form.Row>
                            <Container>
                                <Row>
                                    <Col>
                                        <Button variant="primary" type="submit">
                                            Download
                                        </Button>
                                        {react_helpers.displayIf(()=>isLoading, Spinner)({animation:"border", role:"status"})}
                                    </Col>
                                </Row>
                            </Container>
                        </Form>
                    </Col>
                </Row>
            </Container>
        )
    };
    return (
        <>
            <div>
                <TypeaheadRemote
                    forwardRef={typeaheadRef}
                    handleSelected={handleSelected}
                    selected={selected}
                    searchEndpoint={supplierSearchEndpoint}
                    placeholder={textPlaceholder}
                    labelKey={labelKey}
                    renderMenuItem={renderMenuItem}
                />
                {selected ?
                    renderSupplierDetails(selected)
                    :
                    <Alert variant="info">Pas de fournisseur choisi</Alert>}
            </div>
        </>
    )
}