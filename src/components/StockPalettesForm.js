import React, { useState, useEffect, useReducer } from 'react';
import TypeaheadRemote from '../components/TypeaheadRemote';

import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import Alert from 'react-bootstrap/Alert'
import Spinner from 'react-bootstrap/Spinner'
import Container from 'react-bootstrap/Container'
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col';

import BootstrapTable from 'react-bootstrap-table-next';
import cellEditFactory from 'react-bootstrap-table2-editor';
import paginationFactory from 'react-bootstrap-table2-paginator';

import { zipObject } from 'lodash';
import Chart from "react-apexcharts";
import axios from 'axios';
import moment from 'moment';

import table_helpers from '../utils/bootstrap_table';
import react_helpers from "../utils/react_helpers";
import ConfigApi from "../config.json";

const BASE_URL = ConfigApi.API_URL;
const ITEMS_SEARCH_URL = `${BASE_URL}/items?search=`;
const INVENTORY_URL=ConfigApi.INVENTORY_URL;
const falseFn = table_helpers.falseFn;
const dataFields = [
    ["id", "ID", true, falseFn, "center"],
    ["building", "batiment", false, falseFn, "center"],
    ["location", "emplacement", false, falseFn, "center"],
    ["detail_location", "place", false, falseFn, "center"],
    ["counted", "quantité", false, falseFn, "center"]
  ];
const dataLabels = ["dataField", "text", "hidden", "editable", "headerAlign"];
export default function StockPalettesForm(props) {
    const [selected, setSelected] = useState(null);   // Item selected via typeahead component
    const [itemsInTable, setItemsInTable] = useState([]);
    const columns = table_helpers.buildColumnData(dataFields, dataLabels);
    const typeaheadRef = React.createRef();

    const resetStates = () =>{
        setSelected(null);
        setItemsInTable([]);
    };
    const clearTypeahead = ()=>{
        resetStates();
        typeaheadRef.current.clear();
        typeaheadRef.current.focus();
    };

    const fetchItems  = (code)=>{
        return axios({method:"get", url:`${INVENTORY_URL}/api/items`, params:{itemcode: code}})
               .then(response=>setItemsInTable(response.data));
    };
    // table handling functions
    const handleSelected = (selected) => {
        let item = selected[0];
        setSelected(item);
        if(selected && item) {
            fetchItems(item.itemcode);
        }
    }
    const itemsSearchEndpoint = query => {
        let numberPattern = /^\d{6,}$/g;
        if(query.match(numberPattern)){
            return `${BASE_URL}/items/${query}`;
        }
        return `${ITEMS_SEARCH_URL}${query}`;
    };
    const buildTypeAheadComponent = (itemsSearchEndpoint, handleSelected, selected)=>{
        return props =>{
            return (<TypeaheadRemote
                {...props}
                handleSelected={handleSelected}
                selected={selected}
                searchEndpoint={itemsSearchEndpoint}
                placeholder="Rechercher article ou code ..."
                labelKey={option => `${option.itemcode} - ${option.itemname}`}
                renderMenuItem={(option, props) => (
                    <div>
                        <span style={{whiteSpace:"initial"}}><div style={{fontWeight:"bold"}}>{option.itemcode}</div> - {option.itemname} - {option.onhand}</span>
                    </div>
                )}
                onKeyDown={e=>{
                    if (e.keyCode == 9) e.preventDefault();
                }
                }
            />);
        }
    };
    return (<>
    <Container fluid>
        <Row>
        <Col xs={6}>
            <Button variant="warning" onClick={clearTypeahead}>Clear</Button>
        </Col>
        </Row>
        <Row>
            <Col>
            {buildTypeAheadComponent(itemsSearchEndpoint, handleSelected, selected)({forwardRef:typeaheadRef})}
            </Col>
        </Row>
        <Row>
            <Col>
            {react_helpers.displayIf(()=>selected && itemsInTable.length>0, BootstrapTable)({
                 keyField:"id"
                 ,data:itemsInTable
                 ,columns:columns
            })}
            </Col>
        </Row>
    </Container>
    </>)
}