import React, { useState } from 'react';
import Button from 'react-bootstrap/Button';
import Col from 'react-bootstrap/Col';
import Spinner from 'react-bootstrap/Spinner'
import Container from 'react-bootstrap/Container'
import Row from 'react-bootstrap/Row'
import Form from 'react-bootstrap/Form';
import Alert from 'react-bootstrap/Alert';

import BootstrapTable from 'react-bootstrap-table-next';
import cellEditFactory, { Type } from 'react-bootstrap-table2-editor';

import { zip } from 'lodash';
import axios from 'axios';
import TypeaheadRemote from './TypeaheadRemote';
import ConfigApi from "../config.json";
import table_helpers from '../utils/bootstrap_table';
import react_helpers from "../utils/react_helpers";

const BASE_URL = ConfigApi.API_URL;
const SEARCH_URL = `${BASE_URL}/suppliers/onorder/status?search=`;
const SERVICES_API_URL=ConfigApi.SERVICES_API_URL;
const falseFn = table_helpers.falseFn;
const trueFn = table_helpers.trueFn;
const dataFields = [
    ["linenum", "ID", false, falseFn],
    ["dscription", "Dscription", false, falseFn],
    ["serialnum", "Num Lot", false, trueFn],
    ["dluo", "DLUO", false, trueFn]
];
const dataLabels = ["dataField", "text", "hidden", "editable"];

export default function DluoLotForm(props) {
    const textPlaceholder = "Entrer un nom de fournisseur...";
    const columns = table_helpers.buildColumnData(dataFields, dataLabels, (ks,cv)=>{
        if (cv[0] == "dluo") {
            cv = cv.concat([{ type: Type.DATE },
            (cell) => {
                let dateObj = cell;
                if (typeof cell !== 'object') {
                    dateObj = new Date(cell);
                }
                return dateObj.toISOString().split("T")[0];
            }
            ]);
            ks = ks.concat(["editor", "formatter"])
        }
        if(cv[0]=="serialnum"){
            ks = ks.concat("editor");
            cv = cv.concat({pattern: "[0-9]*"});
        }
        return [ks, cv];
    });
    const [orderedItems, setOrderedItems] = useState([]);
    const [selected, setSelected] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isPosted, setIsPosted] = useState(false);
    const [alertMessage, setAlertMessage] = useState(null);
    const typeaheadRef = React.createRef();

    const resetStates = () => {
        setOrderedItems([]);
        setSelected(null);
        setIsLoading(false);
        setIsPosted(false);
        setAlertMessage(null);
    };
    /**
     * 
     * @param {cardcode from sap} supplier_code 
     */
    const fetch_order_lines = docnum => {
        let items_url_endpoint = `${BASE_URL}/suppliers/orders/${docnum}`
        axios({ method: "get", url: items_url_endpoint })
            .then(items => {
                setOrderedItems(items.data.map((p, idx) => {
                    let current_date=new Date();
                    if(p.u_dluo) {
                        current_date=p.u_dluo;
                    }
                    return Object.assign({}, {id: idx},p, {dluo:current_date}, {discount:0, discounted_price:0})
                }));
            });
    }
    /**
     * Callback when a supplier is selected 
     * @param {item selected from the supplier search field} selected 
     */
    const handleSelected = (selected) => {
        let selected_supplier = selected[0];
        setSelected(selected_supplier);
        if (selected.length > 0) {
            fetch_order_lines(selected_supplier.docnum);
        }
        else {
            // Clean state at supplier change
            resetStates();
        }
    }
    const supplierSearchEndpoint = query => `${SEARCH_URL}${query}`;
    const labelKey = option => `${option.cardname} - ${option.comment ? option.comments.match(/\d{4}-\d{2}-\d{2}/)[0]:""}`;
    const renderMenuItem = (option, props) => (
        <div>
            <span style={{ whiteSpace: "initial" }}><div style={{ fontWeight: "bold" }}>{option.cardname}</div> - {option.comments?option.comments:""}</span>
        </div>
    )
    const clearTypeahead = ()=>{
        resetStates();
        typeaheadRef.current.clear();
        typeaheadRef.current.focus();
    };
    /**
     * 
     * @param {*} event 
     */
    const handleSubmit = (event) => {
        /**
         * {
         *   docnum: 7126,
         *   lines: [{linenum:, itemcode:, serialnum:, u_dluo:, discount:}]
         * }
         */
        if(selected){
            let lines_fields = ["linenum", "itemcode", "serialnum", "u_dluo", "discount"];
            let item_fields =  ["linenum", "itemcode", "serialnum", "dluo"  , "discount"];
            let fields = zip(item_fields, lines_fields);
            let json_order = { docnum: selected.docnum};
            let items_to_order = orderedItems.filter(item => item.serialnum.length>0);
            let ordered_items = items_to_order.map(item => fields.reduce((acc, f) => Object.assign(acc, { [f[1]]: item[f[0]] }), new Object()))
            let post_data = Object.assign({}, json_order, { lines: ordered_items });
            let po_url = `${SERVICES_API_URL}/purchase-order/dluo`;
            console.log(post_data);
            setIsLoading(true)
            axios({method:"post", url:po_url, data:post_data})
            .then(response=> {
                setIsLoading(false);
                if(response.status==200) {
                    setIsPosted(true);
                    setAlertMessage("La commande est mise à jour");
                }
            })
            .catch(error => {
                setIsLoading(false);
                setAlertMessage("Erreur dans le post");
                setIsPosted(true);
            });
        }
        event.preventDefault();
    }
    const onDiscountChange = row => {
        return event=>{
            let discounted = event.target.value;
            row.discounted_price = discounted
            row.discount = parseFloat((1-(discounted/row.price))*100.0).toFixed(2);
            setOrderedItems(orderedItems.map(s=>s.id==row.id? row : s))
        }
    };
    const handleFocus = (event) => {event.target.select()};
    const rowRenderer = row =>{
        return (
        <div>
            <Form>
            <Row>
                <Col>
                {table_helpers.buildGroupDetails([`price-${row.id}`, "Prix HT", "text", "", row.price, true])}
                </Col>
                <Col>
                {table_helpers.buildGroupDetails([`discount-${row.id}`, "Prix HT remise", "text", "Entrer la remise HT", row.discounted_price, false
                                                 ,onDiscountChange(row), handleFocus])}
                </Col>
                <Col>
                {table_helpers.buildGroupDetails([`quantity-${row.id}`, "Quantite", "text", "Quantite commande", row.quantity, true])}
                </Col>
            </Row>
            </Form>

        </div>
        )
    };
    const expandRow = {
        renderer: rowRenderer,
        showExpandColumn: true,
        expandByColumnOnly: true,
        onlyOneExpanding: true
    };

    return (
        <>
            <Container fluid>
                    <Row>
                        <Col>
                            <TypeaheadRemote
                                forwardRef={typeaheadRef}
                                handleSelected={handleSelected}
                                selected={selected}
                                searchEndpoint={supplierSearchEndpoint}
                                placeholder={textPlaceholder}
                                labelKey={labelKey}
                                renderMenuItem={renderMenuItem}
                            />
                        </Col>
                    </Row>
                    <Row className="mt-2">
                        <Col xs={6}>
                            <Button variant="primary" onClick={handleSubmit}>
                                Submit
                            </Button>
                            {react_helpers.displayIf(()=>isLoading, Spinner)({animation:"border", role:"status"})}
                            {react_helpers.displayIf(()=>isPosted, Alert)({variant:alertMessage?"danger":"success", dismissible:true, children:alertMessage})}
                            
                        </Col>
                        <Col xs={6}>
                            <Button variant="warning" onClick={clearTypeahead}>Clear</Button>
                        </Col>
                    </Row>
                </Container>
            <BootstrapTable
                keyField="linenum"
                data={orderedItems}
                columns={columns}
                expandRow={expandRow}
                cellEdit={cellEditFactory({ mode: 'click', blurToSave: true, autoSelectText: true })}
            />
        </>
    )
}