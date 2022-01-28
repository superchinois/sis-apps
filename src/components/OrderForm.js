import React, { useState, useEffect } from 'react';
import Alert from 'react-bootstrap/Alert';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import Col from 'react-bootstrap/Col';
import Row from 'react-bootstrap/Row'
import Spinner from 'react-bootstrap/Spinner'
import Container from 'react-bootstrap/Container'


import BootstrapTable from 'react-bootstrap-table-next';
import filterFactory, { textFilter } from 'react-bootstrap-table2-filter';
import cellEditFactory from 'react-bootstrap-table2-editor';

import { zip } from 'lodash';
import axios from 'axios';
import TypeaheadRemote from './TypeaheadRemote';
import CreatableSelect from 'react-select/creatable';
import ConfigApi from "../config.json";

//import io from 'socket.io-client';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import table_helpers from '../utils/bootstrap_table';
import react_helpers from '../utils/react_helpers';

const BASE_URL = ConfigApi.API_URL;
const API_URL = ConfigApi.SERVICES_API_URL;
const SEARCH_URL = `${BASE_URL}/suppliers?search=`;
const falseFn = table_helpers.falseFn;
const dataFields = [
    ["id", "ID", true, falseFn, false],
    ["itemcode", "Itemcode", false, falseFn, false],
    ["itemname", "Dscription", false, falseFn, false],
    ["quantity", "Quantité", false, table_helpers.trueFn, true]
];
const dataLabels = ["dataField", "text", "hidden", "editable", "sort"];
let nameFilter;
const emailOptions = [
    { value: 'commande@sis.re', label: 'Commande'},
    { value: 'eric.lichamyon@sis.re', label: 'Eric' },
    { value: 'gilles.lichamyon@sis.re', label: 'Gilles' },
    { value: 'j.louise@sis.re', label: 'Johann' },
];

export default function OrderForm(props) {
//    const socket = io(ConfigApi.WS_TASK_STATUS_URL);
    const textPlaceholder = "Entrer un nom de fournisseur...";
    const [selected, setSelected] = useState(null);
    const columns = table_helpers.buildColumnData(dataFields, dataLabels, (cv, ks)=>{
        if (cv[0] == "itemname") {
            cv = cv.concat(textFilter({
                getFilter: (filter)=>{nameFilter = filter;}
            }));
            ks = ks.concat("filter")
        }
        return [cv, ks];
    });
    const [orderedItems, setOrderedItems] = useState([]);           // 01
    const [deliveryDate, setDeliveryDate] = useState(null);         // 02
    const [orderMode, setOrderMode] = useState("sap");              // 03
    const [recipients, setRecipients] = useState({});               // 04
    const [isOrdered, setIsOrdered] = useState(false);              // 05
    const [alertMessage, setAlertMessage] = useState(null);         // 06
    const [isLoading, setIsLoading] = useState(false);              // 07
    const [supplierEmails, setSupplierEmails] = useState([]);       // 08
    const [deliveryMode, setDeliveryMode] = useState("livraison");  // 09
    const [mailRemark, setMailRemark] = useState(null);             // 10
    const typeaheadRef = React.createRef();

    const resetStates= () => {
        setOrderedItems([]);            // 01
        setDeliveryDate(null);          // 02
        setOrderMode("sap");            // 03
        setRecipients({});              // 04
        setIsOrdered(false);            // 05
        setAlertMessage(null);          // 06
        setIsLoading(false);            // 07
        setSupplierEmails([]);          // 08
        setDeliveryMode("livraison");   // 09
        setMailRemark(null);            // 10
    };

/*     useEffect(() => {
        socket.on('connect', ()=>{console.log("connected");});
        socket.on('task status', (data) => toast(data.status));
        socket.on('disconnect', ()=>{console.log("connected");});
    }, []); */

    /**
     * 
     * @param {cardcode from sap} supplier_code 
     */
    const fetch_orderable_items = supplier_code => {
        let items_url_endpoint = `${BASE_URL}/items?cardcode=${supplier_code}`
        axios({ method: "get", url: items_url_endpoint })
            .then(items => {
                // total is product of factor_i
                setOrderedItems(items.data.map((p, idx) => Object.assign({}, { id: idx, quantity: 0, total: 0 }, p)));
            });
    }
    /**
     * fetch email contacts for supplier
     * 
     * @param {*} supplier_code 
     */
    const fetch_emails = supplier_code => {
        let supplier_info_url = `${BASE_URL}/suppliers/${supplier_code}`;
        axios({ method: "get", url: supplier_info_url })
            .then(info => {
                setSupplierEmails(info.data.order_emails);
            });
    };
    /**
     * Callback when a supplier is selected 
     * @param {item selected from the supplier search field} selected 
     */
    const handleSelected = (selected) => {
        let selected_supplier = selected[0];
        setSelected(selected_supplier);
        if (selected.length > 0) {
            fetch_orderable_items(selected_supplier.cardcode);
            fetch_emails(selected_supplier.cardcode);
        }
        else {
            // Clean state at supplier change
            resetStates();
        }
    }
    /**
     * Process various states to build the json order to post
     * @param {*} event 
     */
    const handleSubmit = (event) => {
        let extract_fields = ["itemcode", "quantity", "pcb_achat", "pcb_pal", "itemname"];
        let item_fields = ["itemcode", "factor1", "factor2", "factor3", "itemname"];
        let fields = zip(extract_fields, item_fields);
        let formatted_date = deliveryDate ? deliveryDate : new Date().toISOString().split("T")[0];
        let json_order = { cardcode: selected.cardcode, 
                        deliveryDate: formatted_date, 
                        cardname: selected.cardname, 
                        mode: orderMode ,
                        recipients: recipients,
                        deliveryMode: deliveryMode,
                        mail_remark: mailRemark
                    };
        let items_to_order = orderedItems.filter(item => item.quantity > 0);
        let ordered_items = items_to_order.map(item => fields.reduce((acc, f) => Object.assign(acc, { [f[1]]: item[f[0]] }), new Object()))
        let post_data = Object.assign({}, json_order, { ordered_items: ordered_items });
        let po_url = `${API_URL}/purchase-order`;
        console.log(post_data);
        setIsLoading(true);
        axios({ method: "post", url: po_url, data: post_data })
            .then(response => {
                console.log(response.data);
                if (response.status == 200) {
                    setIsOrdered(true);
                }
                if (response.status == 500) {
                    setIsOrdered(true);
                    setAlertMessage("Une erreur 500 s est produite");
                }
                setIsLoading(false);
            });
        event.preventDefault();
    }
    const handleClearBtn = ()=>{nameFilter('')};
    const onDeliveryModeChange = event => { setDeliveryMode(event.target.value) };
    const handleModeSelect = event => { setOrderMode(event.target.value); setIsOrdered(false); setIsLoading(false) };
    const onDateChange = event => { setDeliveryDate(event.target.value); };
    const onChangeTextArea = (event) => {setMailRemark(event.target.value);};
    
    const supplierSearchEndpoint = query => `${SEARCH_URL}${query}`;
    
    const labelKey = option => `${option.cardname}`;
    const renderMenuItem = (option, props) => (
        <div>
            <span style={{ whiteSpace: "initial" }}><div style={{ fontWeight: "bold" }}>{option.cardcode}</div> - {option.cardname}</span>
        </div>
    )
    const onChangeRecipients = (newValue, actionMeta) => {
        let receiver_field = actionMeta.name;
        setRecipients(Object.assign({}, recipients, { [receiver_field]: newValue.map(v => v.value) }));
    };
   
    const renderModeDetails = () => {
        return (
            <>
                <Row>
                    <Form.Group as={Col}>
                        <Form.Label>Destinataire</Form.Label>
                        <CreatableSelect
                            defaultValue={[]}
                            isMulti
                            name="receiver_to"
                            options={supplierEmails}
                            className="basic-multi-select"
                            classNamePrefix="select"
                            onChange={onChangeRecipients}
                            placeholder={"Choisir destinataires ..."}
                        />
                    </Form.Group>
                </Row>
                <Row>
                    <Form.Group as={Col}>
                        <Form.Label>Copie SIS</Form.Label>
                        <CreatableSelect
                            defaultValue={[]}
                            isMulti
                            name="receiver_cc"
                            options={emailOptions}
                            className="basic-multi-select"
                            classNamePrefix="select"
                            onChange={onChangeRecipients}
                            placeholder={"Choisir contact sis"}
                        />
                    </Form.Group>
                </Row>
                <Row>
                    <Form.Group as={Col}>
                        <Form.Label>Remarque</Form.Label>
                        <Form.Control as="textarea" rows={2} onChange={onChangeTextArea}>
                        </Form.Control>
                    </Form.Group>
                </Row>
            </>
        )

    };
    const renderSupplierDetails = (selected) => {
        return (
            <Container fluid>
                <Row className="mt-2">
                <Col>
                <Form onSubmit={handleSubmit}>
                <Row>
                    <Col>
                    {table_helpers.buildGroupDetails(["itemcode", "Cardcode", "text", "Enter itemcode", selected.cardcode, true, undefined, undefined, "-1"])}
                    </Col>
                </Row>
                <Row>
                <Col>
                    {table_helpers.buildGroupDetails(["deliveryDate", "Delivery Date", "date", "YYYY-MM-DD", deliveryDate, false, onDateChange, undefined, "-1"])}
                    </Col>
                    <Form.Group controlId="deliveryMode" as={Col}>
                        <Form.Label>  </Form.Label>
                        <Form.Control as="select" placeholder="Mode Livraison"
                            onChange={onDeliveryModeChange}>
                            <option value="livraison">Livraison</option>
                            <option value="enlevement">Enlevement</option>
                        </Form.Control>
                    </Form.Group>
                </Row>
                <Row>
                    <Form.Group controlId="purchasemode" as={Col}>
                        <Form.Label>Choisir mode commande</Form.Label>
                        <Form.Control as="select" onChange={handleModeSelect}>
                            <option value="sap">Sap</option>
                            <option value="mail">Mail</option>
                            <option value="web">Web</option>
                        </Form.Control>
                    </Form.Group>
                </Row>
                { orderMode == "mail" ?
                    renderModeDetails()
                    : null
                }
                <Container>
                    <Row>
                        <Col>
                            <Button variant="primary" type="submit">
                                Submit
                            </Button>
                            {react_helpers.displayIf(()=>isLoading, Spinner)({animation:"border", role:"status"})}
                        </Col>
                        <Col>
                            <Button variant="info" onClick={handleClearBtn}>
                                Clear filter
                            </Button>
                        </Col>
                    </Row>
                </Container>

            </Form>
            </Col>
                </Row>
            </Container>
        )
    }
    const rowRenderer = row => {
        return (
            <Form>
                <Row>
                    <Col>
                    {table_helpers.buildGroupDetails(["factor2", "Colisage achat", "text", "", row.pcb_achat, true, undefined, undefined, "-1"])}
                    </Col>
                    <Col>
                    {table_helpers.buildGroupDetails(["factor3", "Colisage palette", "text", "", row.pcb_pal, true, undefined, undefined, "-1"])}
                    </Col>
                    <Col>
                    {table_helpers.buildGroupDetails(["total", "Total a facturer", "text", "", row.total, true, undefined, undefined, "-1"])}
                    </Col>
                </Row>
                <Row>
                    <Col>
                    {table_helpers.buildGroupDetails(["onhand", "Stock SAP", "text", "", row.onhand, true, undefined, undefined, "-1"])}
                    </Col>
                    <Col>
                    {table_helpers.buildGroupDetails(["onhandbypack", "Stock en colis", "text", ""
                    , (parseFloat(row.onhand) / parseFloat(row.pcb_achat)).toFixed(2), true, undefined, undefined, "-1"])}
                    </Col>
                    {row.pcb_pal > 1 ?
                        <Col>
                        {table_helpers.buildGroupDetails(["onhandpallet", "Stock en palette", "text", ""
                        , (parseFloat(row.onhand) / parseFloat(row.pcb_achat) / parseFloat(row.pcb_pal)).toFixed(2), true, undefined, undefined, "-1"])}
                        </Col>
                    : null}
                </Row>
            </Form>
        )
    }
    const expandRow = {
        renderer: rowRenderer,
        showExpandColumn: true,
        expandByColumnOnly: true,
        onlyOneExpanding: true
    };
    const cellEdit = cellEditFactory({
        mode: 'click',
        blurToSave: true,
        autoSelectText: true,
        afterSaveCell: (oldValue, newValue, row, column) => {
            row.total = row.quantity * row.pcb_achat * row.pcb_pal;
            // Hack to force render table to change style of row.quantity >0
            setOrderedItems(orderedItems.map(i => i));
        }
    });
    const rowStyle2 = (row, rowIndex) => {
        const style = {};
        if (row.quantity > 0) {
            style.backgroundColor = '#c8e6c9';
        }
        return style;
    };
    return (<>
        <div><ToastContainer/></div>
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
        <div>
            {isOrdered ?
                alertMessage ?
                    <Alert variant="danger">{alertMessage}</Alert>
                    : <Alert variant="info" dismissible>La Commande {orderMode} a été passée</Alert>
                : null
            }
        </div>
        <div>
            {orderedItems.length > 0 ?
                <BootstrapTable
                    keyField="id"
                    data={orderedItems}
                    columns={columns}
                    cellEdit={cellEdit}
                    expandRow={expandRow}
                    filter={filterFactory()}
                    rowStyle={rowStyle2} />
                : null}
        </div>
    </>)
}