import React, { useState } from 'react';
import Alert from 'react-bootstrap/Alert';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import Col from 'react-bootstrap/Col';
import Row from 'react-bootstrap/Row'
import Spinner from 'react-bootstrap/Spinner'
import Container from 'react-bootstrap/Container'
import react_helpers from "../utils/react_helpers";
import common_helpers from '../utils/common';
import {zipObj, sortBy, prop, compose, nth, split, invoker} from 'ramda';

const fetchData = common_helpers.downloadExcelFile({method: "GET"});
/**
 * 
 * @param {*} props 
 * props must include :
 *   remote_url_fn: the remote url for getting computed data
 *   textPlaceholder: text placeholder for what text to enter to search
 *   search_url : URL to use to search for the query
 */
const categories_data = {
    "100": 'EPICERIE SALEE',
"102": 'FRAIS',
"104": 'B. ALCOOL VIN BIERE',
"105": 'ENTRETIEN & HYGIENE',
"106": 'EMBALLAGE',
"107": 'DIVERS & CIGARETTES',
"109": 'BOIS. NON ALCOOL',
"110": 'EPICERIE SUCREE',
"112": 'SURGELES'
};

const cat_labels = ["value", "label"];
const category_options = sortBy(prop(1))(Object.entries(categories_data)).map(zipObj(cat_labels));
const toISOStringDate = compose(nth(0), split("T"), invoker(0, 'toISOString'));
export default function UnsoldForm(props) {
    const remote_url_fn=props.remote_url_fn;
    const [selected, setSelected] = useState("104");
    const [isLoading, setIsLoading] = useState(false);

    const resetStates = () => {
        setSelected(null);
        setIsLoading(false);
    };

    const handleSelectChange = (event)=>{
        let option_value=event.target.value;
        setSelected(option_value);
    };
    const handleSubmit = (event) => {
        let url = remote_url_fn();
        setIsLoading(true);
        let url_search_params = new URLSearchParams({
            groupcode: selected,
        })
        let todayIsoString = toISOStringDate(new Date());
        let filename = `${categories_data[selected].replace(/ /g, "_")}_${todayIsoString}`;
        fetchData(url+"?"+url_search_params, filename, {}, () => setIsLoading(false))
        event.preventDefault();
    };
    const renderSupplierDetails = () => {
        return (
            <Container fluid>
                <Row className="mt-2">
                    <Col>
                        <Form onSubmit={handleSubmit}>
                            <Row>
                                <Col>
                                <Form.Control
                                    as="select"
                                    id="inlineFormCustomSelectPref"
                                    custom
                                    onChange={handleSelectChange}
                                >
                                    {category_options.map(option => {
                                        return (<option key={option.value} value={option.value}>{option.label}</option>);
                                    })}
                                </Form.Control>
                                </Col>
                                <Col>
                                    <Container>

                                        <Button variant="primary" type="submit">
                                            Download
                                        </Button>
                                        {react_helpers.displayIf(() => isLoading, Spinner)({ animation: "border", role: "status" })}
                                    </Container>
                                </Col>
                            </Row>
                            
                        </Form>
                    </Col>
                </Row>
            </Container>
        )
    };
    return (
        <>
            <div>
            {renderSupplierDetails()}
            </div>
        </>
    )
}