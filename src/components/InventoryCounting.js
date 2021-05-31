import React, { useState, useEffect, useReducer } from 'react';

import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import Container from 'react-bootstrap/Container'
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col';
import Spinner from 'react-bootstrap/Spinner'
import DropdownButton from 'react-bootstrap/DropdownButton';
import Dropdown from 'react-bootstrap/Dropdown';

import BootstrapTable from 'react-bootstrap-table-next';
import { some } from 'lodash';
import axios from 'axios';
import CreatableSelect from 'react-select/creatable';
import AsyncCreatableSelect from 'react-select/async-creatable';
import table_helpers from '../utils/bootstrap_table';
import react_helpers from '../utils/react_helpers';
import ConfigApi from "../config.json";
import {evaluate} from 'mathjs';

const BASE_URL = ConfigApi.INVENTORY_URL;
const falseFn = table_helpers.falseFn;
const dataFields = [
    ["id", "ID", true, falseFn],
    ["itemcode", "Itemcode", false, falseFn],
    ["itemname", "Dscription", false, falseFn],
    ["counted", "Compté", false, falseFn]
  ];
const dataLabels = ["dataField", "text", "hidden", "editable"];
const initialData = {building: "", location:"", items:[]};
const commonDataReducer = (state, action)=>{
    switch(action.type) {
        case 'UPDATE_ITEMS':
            let rowIndex = action.item_row;
            let items = state.items
            let updatedRow = Object.assign({}, items[rowIndex], action.data);
            items[rowIndex] = updatedRow;
            return Object.assign({}, state, {items: items});
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
export default function InventoryCounting(props) {
    let [editingRow, setEditingRow] = useState(null);
    let [buildingOptions, setBuildingOptions] = useState([]);
    let [alleysOptions, setAlleysOptions] = useState([]);
    let [commonData, dispatch] = useReducer(commonDataReducer, initialData);
    let [show, setShow] = useState(false);
    let [isLoading, setIsLoading] = useState(false);
    const [selectedInTable, setSelectedInTable] = useState({selected:[]});
    let columns = table_helpers.buildColumnData(dataFields, dataLabels);
    const resetStates = ()=>{
    };
    useEffect(()=>{
        let building_url=`${BASE_URL}/api/buildings`;
        axios({ method: "get", url: building_url })
            .then(items => {
                let result = items.data.map(_=>{return {value: _, label:_};});
                setBuildingOptions(result);
            });
    },[]);
    const handleClose = () => {setShow(false)};
    const handleShow = () => setShow(true);
    const promiseOptions = (inputValue)=>{
        let alleys_url=`${BASE_URL}/api/alleys_levels`;
        return new Promise(resolve => {
            axios({method:"get", url: alleys_url})
            .then(response => {
                let result = response.data.map(_=>{return {value: _, label:_};});
                setAlleysOptions(result);
                let display = result;
                if(inputValue) {
                    display = filterAlleys(inputValue);
                }
                resolve(display);})
        });
    };
    const fetchItemsByLocation = () =>{
        let items_url=`${BASE_URL}/api/items`
        if(commonData.building.length>0 && commonData.location.length>0){
            axios({method:"get", url:items_url, params:{building: commonData.building, location:commonData.location}})
            .then(response => {
                updateCommonData("items", response.data);
                setIsLoading(false);
            });
        }
    };
    const handleFetchBtn= ()=>{setIsLoading(true);fetchItemsByLocation();};
    const filterAlleys = (inputValue) => {
        return alleysOptions.filter(i =>
          i.label.toLowerCase().includes(inputValue.toLowerCase())
        );
      };
    const updateCommonData = (id, data) => dispatch({type:'ADD_DATA', id:id, data:data});
    const onChangeBuilding = (newValue, actionMeta)=>{
        updateCommonData("building", newValue.value);
        console.group('Value Changed');
        console.log(newValue);
        console.log(`action: ${actionMeta.action}`);
        console.groupEnd();
    };
    const onChangeLocation = (newValue, actionMeta) =>{
        updateCommonData("location", newValue.value);
    };
    const rowStyle2 = (row, rowIndex) => {
        const style = {};
        if (row.counted > 0) {
            style.backgroundColor = '#c8e6c9';
        }
        return style;
    };
    const rowEvents = {
        onClick: (e, row, rowIndex) => {
            setEditingRow(rowIndex);
            handleShow();
        },
      };
    const handleChangeCounted = (action) => {
        console.log(action);
        dispatch(action);
    }

    const selectRow = {
        mode: 'checkbox',
        clickToSelect: true,
        selected: selectedInTable.selected,
        headerColumnStyle: { textAlign: 'center' },
        onSelect: table_helpers.buildHandleOnSelect(()=>selectedInTable,setSelectedInTable),
        onSelectAll: table_helpers.buildHandleAllOnSelect(setSelectedInTable)
    };
    const modifyItem = ()=>{
        let item_table_id = selectedInTable.selected[0]-1;
        // save item id to be modified in component state
        console.log(commonData.items[item_table_id]);
        setSelectedInTable({selected:[]});
    };
    const ModifyModal = (props)=>{
        // state of the modal
        // component
        return (<>
            <Modal size="lg" show={show} onHide={handleCloseModify}>
                <Modal.Header closeButton>
                    <Modal.Title>{row.itemname}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Container fluid>
                        {/**Body of the modal with TypeaheadRemote*/}
                  </Container>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="primary" onClick={()=>{
                        handleChange({type:'UPDATE_ITEMS', item_row: rowIndex, data: {counted: counted, detail_counted: detailCounted}});
                        handleCloseModify();
                        }}>
                    Save Changes
                    </Button>
                    <Button variant="secondary" onClick={handleCloseModify}>Close</Button>
                </Modal.Footer>
            </Modal>
        </>);
    }
    const CountingModal =(props) =>{
        let {rowIndex, handleChange} = props;
        let row = commonData.items[rowIndex];
        let [detailCounted, setDetailCounted] = useState(row.detail_counted||"");
        let [counted, setCounted] = useState(row.counted||"");
        const handleFocus = (event)=>{event.target.select()};
        return ( <>
            <Modal size="lg" show={show} onHide={handleClose}>
                <Modal.Header closeButton>
                    <Modal.Title>{row.itemname}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Container fluid>
                        <Row>
                        <Col>
                            {table_helpers.buildGroupDetails(["puht","Prix Unit. HT", "text", "", parseFloat(row.pu_ht).toFixed(2), true])}
                            </Col>
                            <Col>
                            {table_helpers.buildGroupDetails(["test-5","Codebarre", "text", "", row.codebars, true])}
                            </Col>
                            <Col>
                            {table_helpers.buildGroupDetails(["test-6","Stock SAP", "text", "", row.onhand, true])}
                            </Col>
                        </Row>
                        <Row>
                            <Col>
                            {table_helpers.buildGroupDetails(["test-7","Stock en Colis","text", "", 
                            (parseFloat(row.onhand) / parseFloat(row.colisage_achat)).toFixed(2), true, undefined, undefined, "-1"])}
                            </Col>
                            {react_helpers.displayIf(_=>row.pcb_pal>1, Col)({
                                children: (
                                    table_helpers.buildGroupDetails(["onhandpallet", "Stock en palette", "text", ""
                                    , (parseFloat(row.onhand) / parseFloat(row.colisage_achat) / parseFloat(row.pcb_pal)).toFixed(2), true, undefined, undefined, "-1"])
                                )
                            })}
                        </Row>
                        <Row>
                            <Col>
                            {table_helpers.buildGroupDetails(["test-4","Colisage Vente", "text", "", row.colisage_vente, true])}
                            </Col>
                            <Col>
                            {table_helpers.buildGroupDetails(["test-3","Colisage Achat", "text", "", row.colisage_achat, true])}
                            </Col>
                            {react_helpers.displayIf(_=>row.pcb_pal>1, Col)(
                                {children:table_helpers.buildGroupDetails(["test-8","Colisage Pal", "text", "", row.pcb_pal, true])}
                            )}
                        </Row>
                        <Row>
                            <Col>
                                {table_helpers.buildGroupDetails(["test-2","Eval", "text", "Eval Comptage", counted, true])}
                            </Col>
                        </Row>
                        <Row>
                            <Col>
                                {table_helpers.buildGroupDetails(["test-1","Compté", "text", "Entrer comptage", 
                                detailCounted, false, e=>{
                                    let inputValue = e.target.value;
                                    setDetailCounted(inputValue);
                                    let endOperator = some(["+","-", "/", "*"].map(_=> inputValue.endsWith(_)), Boolean);
                                    if (endOperator){
                                        setCounted(evaluate(inputValue.substring(0,inputValue.length-1)));
                                    }
                                    else {
                                        setCounted(evaluate(inputValue));
                                    }
                                }, handleFocus])}
                            </Col>
                      </Row>
                  </Container>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="primary" onClick={()=>{
                        handleChange({type:'UPDATE_ITEMS', item_row: rowIndex, data: {counted: counted, detail_counted: detailCounted}});
                        handleClose();
                        }}>
                    Save Changes
                    </Button>
                    <Button variant="secondary" onClick={handleClose}>Close</Button>
                </Modal.Footer>
            </Modal>
          </>);
        
    };
    return(<>
    <Container fluid>
        <Row>
            <Col>
            {buildingOptions.length >0 ?
            <CreatableSelect
            name="building"
            options={buildingOptions}
            className="basic-select"
            classNamePrefix="select"
            onChange={onChangeBuilding}
            placeholder={"Choisir batiment ..."}
            />
            :null}
            </Col>
        </Row>
        <Row>
            <Col>
            <AsyncCreatableSelect
            defaultOptions
            cacheOptions
            loadOptions={promiseOptions}
            onChange={onChangeLocation}
        />
            </Col>
        </Row>
        <Row>
            <Col>
                <Button variant="primary" onClick={handleFetchBtn}>Fetch Items</Button>
                {react_helpers.displayIf(()=>isLoading, Spinner)({animation:"border", role:"status"})}
            </Col>
            <Col>
            <DropdownButton id="dropdown-basic-button" title="Actions" tabIndex="-1">
            <Dropdown.Item onClick={modifyItem}>Modify</Dropdown.Item>
        </DropdownButton>
            </Col>
        </Row>
        <Row>
            {commonData.items.length>0?
            <BootstrapTable
                keyField="id"
                data={commonData.items}
                columns={columns}
                rowStyle={rowStyle2}
                rowEvents={rowEvents}
                selectRow={selectRow}
            >
            </BootstrapTable>
            :null}
        </Row>
        {react_helpers.displayIf(()=>show, Row)({children:(<CountingModal rowIndex={editingRow} handleChange={handleChangeCounted}/>)})}
    </Container>
    </>);
}