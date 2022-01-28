import React, { useState } from 'react';
import Alert from 'react-bootstrap/Alert';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import Col from 'react-bootstrap/Col';
import Row from 'react-bootstrap/Row'
import Spinner from 'react-bootstrap/Spinner'
import Container from 'react-bootstrap/Container'
import TypeaheadRemote from './TypeaheadRemote';
import react_helpers from "../utils/react_helpers";
import common_helpers from '../utils/common';

const fetchData = common_helpers.downloadExcelFile({method: "POST"});
/**
 * 
 * @param {*} props 
 * props must include :
 *   remote_url_fn: the remote url for getting computed data
 *   textPlaceholder: text placeholder for what text to enter to search
 *   search_url : URL to use to search for the query
 */
export default function SimpleForm(props) {
    const remote_url_fn=props.remote_url_fn;
    const typeaheadRef = React.createRef();
    const [selected, setSelected] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [fetchParams, setFetchParams] = useState({});
    const textPlaceholder = props.textPlaceholder;

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
            setFetchParams({body:JSON.stringify({cardname: selected_supplier.cardname}),
            headers: {"Content-type": "application/json; charset=UTF-8"}});
        }
        else {
            // Clean state at supplier change
            resetStates();
        }
    }
    const supplierSearchEndpoint = query => `${props.search_url}${query}`;
    const labelKey = option => `${option.cardname}`;
    const renderMenuItem = (option, props) => (
        <div>
            <span style={{ whiteSpace: "initial" }}><div style={{ fontWeight: "bold" }}>{option.cardcode}</div> - {option.cardname}</span>
        </div>
    );
    const handleSubmit = (event) => {
        let url = remote_url_fn(selected.cardcode);
        setIsLoading(true);
        fetchData(url, `${selected.cardcode}_${selected.cardname.replace(/ /g, "-")}`, fetchParams, () => setIsLoading(false))
        event.preventDefault();
    };
    const renderSupplierDetails = (selected) => {
        return (
            <Container fluid>
                <Row className="mt-2">
                    <Col>
                        <Form onSubmit={handleSubmit}>
                            <Row>
                                <Form.Group controlId="cardcode" as={Col}>
                                    <Form.Label>Cardcode</Form.Label>
                                    <Form.Control type="text"
                                        placeholder="Cardcode placeholder"
                                        value={selected.cardcode}
                                        readOnly tabIndex="-1" />
                                </Form.Group>
                            </Row>
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
                    <Alert variant="info">Pas d element choisi</Alert>}
            </div>
        </>
    )
}