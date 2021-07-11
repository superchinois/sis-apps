import React, { useState, useEffect, useReducer } from 'react';
import TypeaheadRemote from '../components/TypeaheadRemote';

import Form from 'react-bootstrap/Form';
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col';
import Button from 'react-bootstrap/Button';
import Alert from 'react-bootstrap/Alert'
import Spinner from 'react-bootstrap/Spinner'
import Container from 'react-bootstrap/Container'

import DropdownButton from 'react-bootstrap/DropdownButton';
import Dropdown from 'react-bootstrap/Dropdown';

import BootstrapTable from 'react-bootstrap-table-next';
import cellEditFactory from 'react-bootstrap-table2-editor';
import ToolkitProvider from 'react-bootstrap-table2-toolkit';

import { range } from 'lodash';
import axios from 'axios';

import ConfigApi from "../config.json";
import csv_helpers from "../utils/processCsv";
import table_helpers from "../utils/bootstrap_table";
import react_helpers from '../utils/react_helpers';
import {evaluate} from "mathjs"
import common_helpers from '../utils/common';

const BASE_URL = ConfigApi.API_URL;
const SEARCH_URL = `${BASE_URL}/items?search=`;

const isoStringDate = (date) => date.toISOString().split("T")[0];
const falseFn = table_helpers.falseFn;
const dataFields = [
  ["id", "ID", true, falseFn],
  ["itemcode", "Itemcode", false, falseFn],
  ["itemname", "Dscription", false, falseFn],
];
const dataLabels = ["dataField", "text", "hidden", "editable"];

const initialData = {};
const itemListReducer = (state, action)=>{
    switch(action.type) {
        case 'ADD_DATA':
            return Object.assign({}, state, {[action.id]:action.data});
        case 'REMOVE_DATA':
            const {[action.id]:data, ...new_data} = state;
            return new_data;
        case 'RESET_DATA':
            return initialData;
        default:
            return state;
    }
};
export default function InventoryForm(props) {
    const [selected, setSelected] = useState(null);   // Item selected via typeahead component
    const [selectedItems, setSelectedItems] = useState([]); // item list from typeahead component
    const [selectedInTable, setSelectedInTable] = useState({ selected: [] });
    const [commonData, dispatch] = useReducer(itemListReducer, initialData);
    const [clipText, setClipText] = useState(null);
    const [isPosted, setIsPosted] = useState(false);
    const [showAlert, setShowAlert] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [alertMessage, setAlertMessage] = useState(null);
    const typeaheadRef = React.createRef();
    const columns = table_helpers.buildColumnData(dataFields, dataLabels);
    const resetStates = ()=>{
        setSelected(null);
        setClipText(null);
        setShowAlert(true);
        setIsPosted(false);
        if(typeaheadRef.current) {
            typeaheadRef.current.clear();
            typeaheadRef.current.focus();
        }
    };

      /** effect for fetching sales at date on data selection event */
    useEffect(()=>{
        if(clipText!==null && clipText !== undefined){
            let _typeaheadState = typeaheadRef.current.state;
            typeaheadRef.current.setState(Object.assign({}, _typeaheadState, {text:clipText}));
            typeaheadRef.current.focus();
        }
    }, [clipText]);

    const readClipTextFromSystem = ()=>{
        navigator.clipboard.readText().then(
        clipText => {
            setClipText(clipText);
        });
    };
    // Definitions for Typeahead component

    const itemSearchEndpoint = common_helpers.buildItemSearchEndpoint(BASE_URL);
    
    const labelKey = option => `${option.itemname}`;
    const renderMenuItem = (option, props) => (
        <div>
            <span style={{ whiteSpace: "initial" }}><div style={{ fontWeight: "bold" }}>{option.itemname}</div> - {option.onhand}</span>
        </div>
    )
    const textPlaceholder = "Entrer un nom d article ou un code ..."

    const handleSelectedFile = (event) => {
        let filePath = event.target.files[0];
        csv_helpers.loadCsvFromFile(filePath).then(data=>{
          let ITEMCODE_FIELD="Itemcode";
          let CODEBAR_FIELD="codebars";
          if(data.length>0 && data[0].hasOwnProperty(ITEMCODE_FIELD)){
              CODEBAR_FIELD=ITEMCODE_FIELD
          }
          let codes = data.map(_=>_[CODEBAR_FIELD]);
          let post_data = {itemcodes:codes};
          let test_url = `${BASE_URL}/items`;
          axios({method:"post"
                ,url:test_url
                ,data:post_data}
          ).then(result => {
                addItemsToSelected(result.data.map((item, index)=>{
                    if(item.hasOwnProperty("itemcode")){
                        return item;
                    }
                    else {
                        return {itemcode: codes[index],itemname: "N/A",codebars:"N/A",onhand:"N/A"};
                    }
                }));
                resetStates();
            }).catch(err=>console.error(err));
        }
          );
    }
    const buildGroupDetails= table_helpers.buildGroupDetails;
    const rowRenderer = row =>{
        return (
        <div>
            <Form>
                <Row>
                    <Col>
                    {buildGroupDetails([`items-${row.id}`, "Codebarre", "text","", row.codebars,true])}
                    </Col>
                    <Col>
                    {buildGroupDetails([`items-${row.id}`, "Stock SAP", "text","", row.onhand,true])}
                    </Col>
                </Row>
            </Form>
        </div>
        )
    };

    const addCommonDataToItems = (items)=>{
        return items.map(item=>{
            return Object.assign({}, commonData, item)
        });
    };

    const addItemsToSelected = (itemsToBeAdded)=>{
        // items will be added at the end of list
        let current_id = selectedItems.length == 0 ? 0 : selectedItems.slice(-1)[0].id + 1;
        let new_items_count = itemsToBeAdded.length;
        let new_ids = range(current_id, current_id+new_items_count);
        let added = new_ids.map((current_id, current_index)=>{return {...itemsToBeAdded[current_index], id:current_id}})
        setSelectedItems(addCommonDataToItems([...selectedItems, ...added]));
    };
    // table handling functions
    const handleSelected = (selected) => {
        let item = selected[0];
        setSelected(item);
    }
    const handleSubmit = (event) => {
        addItemsToSelected([selected]);
        resetStates();
        event.preventDefault();
    }

    const handleBtnClick = () => {
        let remaining = selectedItems.filter((item) => !selectedInTable.selected.includes(item.id));
        setSelectedItems(remaining);
        setSelectedInTable({ selected: [] });
    };

    const postItems = ()=>{
        setIsLoading(true);
        let data_to_post = Object.assign({}, commonData, {items:selectedItems});
        let appendDataUrl=`${BASE_URL}/items/inventory-sheets`;
        axios({method:"post", url:appendDataUrl, data: data_to_post})
        .then(response =>{
            setIsLoading(false);
            let status_code = response.status;

            if (status_code=='200') {
                setIsPosted(true);
            }
        })
        .catch(error =>{
            setIsLoading(false);
            console.log(error);
            if (error.response) {
                /*
                 * The request was made and the server responded with a
                 * status code that falls out of the range of 2xx
                 */
                console.log(error.response.data);
                console.log(error.response.status);
                console.log(error.response.headers);
            } else if (error.request) {
                /*
                 * The request was made but no response was received, `error.request`
                 * is an instance of XMLHttpRequest in the browser and an instance
                 * of http.ClientRequest in Node.js
                 */
                console.log(error.request);
            } else {
                // Something happened in setting up the request and triggered an Error
                console.log('Error', error.message);
                setAlertMessage(error.message);
            }
        });
    };

    const handleClearBtn = ()=>{
        resetStates();
    };

    const addRowAbove = () => {
        if(selected != undefined && selected.hasOwnProperty("itemcode")){
            let selected_index = selectedInTable.selected[0];
            let new_selected = [...selectedItems.slice(0, selected_index),selected,...selectedItems.slice(selected_index)];
            // re index elements with order in array
            setSelectedItems(addCommonDataToItems(new_selected.map((_, index)=>Object.assign(_, {id: index}))));
        }
    };

    // bootstraptables parameters

    const selectRow = {
        mode: 'checkbox',
        clickToSelect: false,
        clickToExpand: false,
        selected: selectedInTable.selected,
        headerColumnStyle: { textAlign: 'center' },
        onSelect: table_helpers.buildHandleOnSelect(()=>selectedInTable,setSelectedInTable),
        onSelectAll: table_helpers.buildHandleAllOnSelect(setSelectedInTable)
    };
    const expandRow = {
        renderer: rowRenderer,
        showExpandColumn: true,
        expandByColumnOnly: true,
        onlyOneExpanding: true,
        expandHeaderColumnRenderer: table_helpers.expandHeaderColumnRenderer,
        expandColumnRenderer: table_helpers.expandColumnRenderer
    };
    const addToCommonData = (field, value)=>{
        dispatch({type:'ADD_DATA', id: field, data:`${value}`.trim()})
    };
    const MyExportCSV = table_helpers.buildCsvExport;
    const handleFocus = e=>e.target.select();
    return (<>
        <Container fluid>
        <Row>
        <Col>
        <Form className="no-print">
                <Form.File 
                    id="custom-file-input"
                    label="Choisir fichier"
                    onChange={handleSelectedFile}
                ></Form.File>
            </Form>
        </Col>
        </Row>
        <Row>
            <Col>
            <Form>
                <Row>
                    <Col>
                    {buildGroupDetails(["test-1","Batiment", "text", "Entrer batiment", 
                    commonData.building, false, e=>addToCommonData("building", e.target.value)])}
                    </Col>
                    <Col>
                    {buildGroupDetails(["test-2","Location", "text", "Entrer location", 
                    commonData.location, false, e=>addToCommonData("location", e.target.value), handleFocus])}
                    </Col>
                </Row>
                <Row>
                    <Col>
                    {buildGroupDetails(["test-3","Detail location", "text", "Entrer detail location", 
                    commonData.detail_location, false, e=>addToCommonData("detail_location", e.target.value), handleFocus])}
                    </Col>
                    <Col>
                    <Button className="mr-2" variant="outline-primary" onClick={()=>addToCommonData("detail_location", evaluate(commonData.detail_location)+1)}>+1</Button>
                    <Button variant="outline-secondary" onClick={()=>addToCommonData("detail_location", commonData.detail_location-1)}>-1</Button>
                    </Col>
                </Row>
            </Form>
            </Col>
        </Row>
        <Row className="mt-2">
       
        <Col sm={8}>
        <TypeaheadRemote
                forwardRef={typeaheadRef}
                handleSelected={handleSelected}
                selected={selected}
                searchEndpoint={itemSearchEndpoint}
                placeholder={textPlaceholder}
                labelKey={labelKey}
                renderMenuItem={renderMenuItem}
            />
        </Col>
        <Col sm={4}>
        <Row>
        <DropdownButton id="dropdown-basic-button" title="Actions" tabIndex="-1">
            <Dropdown.Item onClick={readClipTextFromSystem}>Paste</Dropdown.Item>
            <Dropdown.Item onClick={handleBtnClick}>Delete</Dropdown.Item>
            <Dropdown.Item onClick={addRowAbove}>Add row above</Dropdown.Item>
        </DropdownButton>
        <Button className="ml-2" variant="warning" onClick={handleClearBtn} tabIndex="-1">Clear</Button>
        </Row>
        </Col>
        </Row>
        {react_helpers.displayIf(()=>selected, Row)({className:"mt-4",
         children:(<Col><Form onSubmit={handleSubmit}><Button variant="info" type="submit">Add Item</Button></Form></Col>)})}
        
        <Row className="mt-4">
            <Col>
            <ToolkitProvider
                keyField="id"
                data={selectedItems}
                columns={columns}
                exportCSV={{
                    separator:';',
                    blobType:'text/csv;charset=utf-8'
                }}
            >
                {
                    props => (
                        <div style={{marginTop: "1em"}}>
                            <BootstrapTable
                            keyField="id"
                            data={selectedItems}
                            columns={columns}
                            expandRow={expandRow}
                            selectRow={selectRow}
                            cellEdit={cellEditFactory({ mode: 'click', blurToSave: true, autoSelectText: true })}
                            {...props.baseProps}
                            />
                            <hr/>
                            <MyExportCSV {...props.csvProps}></MyExportCSV>
                        </div>
                    )
                }
            </ToolkitProvider>

            </Col>
        </Row>
        <Row>
            <Col>
            <Button className="mt-4" variant="primary" onClick={postItems}>Envoyer Items</Button>
            {react_helpers.displayIf(()=>isLoading, Spinner)({animation:"border", role:"status"})}
            </Col>
        </Row>
        <Row>
            {isPosted && showAlert?
                alertMessage ?
                    <Alert variant="danger">{alertMessage}</Alert>
                    : <Alert variant="info" onClose={() => setShowAlert(false)} dismissible>{selectedItems.length} items has been uploaded</Alert>
                : null
            }
        </Row>
        </Container>
    </>)
}
