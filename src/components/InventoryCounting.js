import React, { useState, useEffect, useReducer } from 'react';

import TypeaheadRemote from '../components/TypeaheadRemote';

import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import Container from 'react-bootstrap/Container'
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col';
import Spinner from 'react-bootstrap/Spinner'
import DropdownButton from 'react-bootstrap/DropdownButton';
import Dropdown from 'react-bootstrap/Dropdown';

import BootstrapTable from 'react-bootstrap-table-next';
import { some, zipObject, sortBy} from 'lodash';
import axios from 'axios';
import CreatableSelect from 'react-select/creatable';
import AsyncCreatableSelect from 'react-select/async-creatable';
import table_helpers from '../utils/bootstrap_table';
import react_helpers from '../utils/react_helpers';
import ConfigApi from "../config.json";
import {evaluate} from 'mathjs';

const BASE_URL = ConfigApi.INVENTORY_URL;
const API_URL = ConfigApi.API_URL;
const SEARCH_URL = `${API_URL}/items?search=`;
const falseFn = table_helpers.falseFn;
const dataFields = [
    ["id", "ID", true, falseFn],
    ["itemcode", "Code", false, falseFn],
    ["itemname", "Dscription", false, falseFn],
    ["counted", "Compté", false, falseFn],
    ["detail_location", "place", false, falseFn]
  ];
const dataLabels = ["dataField", "text", "hidden", "editable"];
const getRowById = (items, id)=>{
    let ids = items.map(_=>_.id);
    let rowIndex = ids.indexOf(id);
    return rowIndex;
};
const initialData = {building: "", location:"", items:[]};
const commonDataReducer = (state, action)=>{
    switch(action.type) {
        case 'UPDATE_ITEMS':
            let items = state.items
            let rowIndex = getRowById(items, action.item_id);
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
const item_id_url = (path) => `${BASE_URL}/api/items/${path}`;

const createItemInDb = (createdItem) =>{
    return axios({method:"post", url:`${BASE_URL}/api/items`, data:createdItem});
};
const updateItemInDB = (item_id, updatedValues)=>{
    let item_url=item_id_url(item_id);
    return axios({method:"put", url: item_url, data:updatedValues});
};
const deleteItemInDb = (item_id) => {
    return axios({method:"delete", url:item_id_url(item_id)});
};
const itemSearchEndpoint = query => {
    let numberPattern = /^\d{6,}$/g;
    if(query.match(numberPattern)){
        return `${API_URL}/items/${query}`;
    }
    return `${SEARCH_URL}${query}`;
};
export default function InventoryCounting(props) {
    let [editingRowId, setEditingRowId] = useState(null);
    let [buildingOptions, setBuildingOptions] = useState([]);
    let [alleysOptions, setAlleysOptions] = useState([]);
    let [commonData, dispatch] = useReducer(commonDataReducer, initialData);
    let [show, setShow] = useState(false);
    let [showModify, setShowModify] = useState(false);
    let [showAddModify, setShowAddModify] = useState(false);
    let [isLoading, setIsLoading] = useState(false);
    const [selectedInTable, setSelectedInTable] = useState({selected:[]});
    let columns = table_helpers.buildColumnData(dataFields, dataLabels);
    const resetStates = ()=>{
    };
    const resetCheckboxes = () => setSelectedInTable({selected:[]});
    useEffect(()=>{
        let building_url=`${BASE_URL}/api/buildings`;
        axios({ method: "get", url: building_url })
            .then(items => {
                let result = items.data.map(_=>{return {value: _, label:_};});
                setBuildingOptions(result);
            });
    },[]);
    const handleClose = () => {setShow(false);resetCheckboxes()};
    const handleCloseModify = () => {setShowModify(false);resetCheckboxes()};
    const handleCloseAddModify = () => {setShowAddModify(false);resetCheckboxes()};
    const handleShow = () => setShow(true);
/*     const promiseOptions = (inputValue)=>{
        let alleys_url=`${BASE_URL}/api/alleys_levels`;
        let params = {};
        if (commonData.building.length>0) params = {building: commonData.building}; 
        return new Promise(resolve => {
            axios({method:"get", url: alleys_url, params:params})
            .then(response => {
                let result = response.data.map(_=>{return {value: _, label:_};});
                setAlleysOptions(result);
                let display = result;
                if(inputValue) {
                    display = filterAlleys(inputValue);
                }
                resolve(display);})
        });
    }; */
    const fetchLocationsByBuilding = (building) =>{
        let alleys_url=`${BASE_URL}/api/alleys_levels`;
        let params = {building:building};
        axios({method:"get", url: alleys_url, params:params})
        .then(response =>{
            let result = response.data.map(_=>{return {value: _, label:_};});
            setAlleysOptions(result);
        });
    };
    const fetchItemsByLocation = () =>{
        let items_url=`${BASE_URL}/api/items`;
        if(commonData.building.length>0 && commonData.location.length>0){
            axios({method:"get", url:items_url, params:{building: commonData.building, location:commonData.location}})
            .then(response => {
                let sortedItems = sortBy(sortBy(response.data, _=>parseInt(_.position)), _=>parseInt(_.detail_location));
                updateCommonData("items", sortedItems);
                setIsLoading(false);
            });
        }
    };
    const insertAtPosition = (array, element, position) => {
        return [...array.slice(0,position), element, ...array.slice(position)];
    };
    const addItemToCommon = (commonData, item, positionInCommon) =>{
        let result = insertAtPosition(commonData, item, positionInCommon);
        let filtered = result.filter((_, index, array)=>{
            if(_.detail_location==item.detail_location){
                array[index]["position"]=index;
                array[index]["isPositionUpdated"]=true;
                return true;
            }
            else return false;
        });
        filtered.forEach(item=>updateItemInDB(item.id, {position:item.position}));
        return result;
    };
    const addItem = (item, positionInTable) =>{
        createItemInDb(item)
        .then(response=>{
            let item_id = response.data.item.id;
            item["id"] = item_id;
            let updated_items = addItemToCommon(commonData.items, item, positionInTable);
            updateCommonData("items", updated_items);
        })
        .catch(console.log);
    };
    const updateItem = (item_id, updated_values)=>{
        updateCommonItems(item_id, updated_values);
        updateItemInDB(item_id, updated_values);
    };
    const deleteItem = () =>{
        let item_ids = selectedInTable.selected;
        updateCommonData("items", commonData.items.filter(_=>!item_ids.includes(_.id)));
        item_ids.forEach((id) =>{
            deleteItemInDb(id);
        });
        resetCheckboxes();
    };
    const handleFetchBtn= ()=>{setIsLoading(true);fetchItemsByLocation();};
    const filterAlleys = (inputValue) => {
        return alleysOptions.filter(i =>
          i.label.toLowerCase().includes(inputValue.toLowerCase())
        );
      };
    const updateCommonData = (id, data) => dispatch({type:'ADD_DATA', id:id, data:data});
    const updateCommonItems = (id, data) => dispatch({type: 'UPDATE_ITEMS', item_id:id, data:data});
    const onChangeBuilding = (newValue, actionMeta) => {
        let selectedBuilding = newValue.value;
        updateCommonData("building", selectedBuilding);
        fetchLocationsByBuilding(selectedBuilding);
    };
    const onChangeLocation = (newValue, actionMeta) => updateCommonData("location", newValue.value);
    const rowStyle2 = (row, rowIndex) => {
        const style = {};
        if (row.counted > 0) {
            style.backgroundColor = '#c8e6c9';
        }
        return style;
    };
    const rowEvents = {
        onClick: (e, row, rowIndex) => {
            setEditingRowId(row.id);
            handleShow();
        },
      };
    const selectRow = {
        mode: 'checkbox',
        clickToSelect: true,
        selected: selectedInTable.selected,
        headerColumnStyle: { textAlign: 'center' },
        onSelect: table_helpers.buildHandleOnSelect(()=>selectedInTable,setSelectedInTable),
        onSelectAll: table_helpers.buildHandleAllOnSelect(setSelectedInTable)
    };
    const setRowIndexToModify = ()=>{
        if(selectedInTable.selected.length>0){
            let item_table_id = selectedInTable.selected[0];
            // save item id to be modified in component state
            setEditingRowId(item_table_id);
            setShowModify(true);
        }
    };
    const buildItemFromMaster = (masterItem, fromBaseItem)=>{
        let fields_toUpdate = ["itemcode", "itemname", "codebars", "onhand", "pcb_vente","pcb_achat","pcb_pal", "vente"];
        let fields =          ["itemcode", "itemname", "codebars", "onhand", "colisage_vente","colisage_achat","pcb_pal","pu_ht"];
        let createdItem = fromBaseItem;
        if(masterItem){
            let values = fields_toUpdate.map(_=>masterItem[_]);
            createdItem = Object.assign(zipObject(fields, values), createdItem);
        }
        return createdItem;
    };
    const buildTypeAheadComponent = (supplierSearchEndpoint, handleSelected, selected)=>{
        return props =>{
            return (<TypeaheadRemote
                handleSelected={handleSelected}
                selected={selected}
                searchEndpoint={supplierSearchEndpoint}
                placeholder="Rechercher article ou code ..."
                labelKey={option => `${option.itemname}`}
                renderMenuItem={(option, props) => (
                    <div>
                       <span style={{whiteSpace:"initial"}}><div style={{fontWeight:"bold"}}>{option.itemcode}</div> - {option.itemname} - {option.onhand}</span>
                    </div>
                )}
                onKeyDown={e=>{
                    if (e.keyCode == 9) e.preventDefault();
                }}
            />);
        }
    };
    const ModifyModal = (props)=>{
        // state of the modal
        let {itemId, handleChange, supplierSearchEndpoint} = props;
        let rowIndex = getRowById(commonData.items, itemId);
        let row = commonData.items[rowIndex];
        let [newLocation, setNewLocation] = useState(row.detail_location);
        let [selectedItem, setSelectedItem] = useState(null);
        // component
        return (<>
            <Modal size="lg" show={showModify} onHide={handleCloseModify}>
                <Modal.Header>
                    <Modal.Title>{row.itemname}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Container fluid>
                        {/**Body of the modal with TypeaheadRemote*/}
                        <Row>
                            <Col>
                            {table_helpers.buildGroupDetails(["detail_loc", "Position", "text","", newLocation, false, 
                            e=>{let inputValue = e.target.value;setNewLocation(inputValue);}])}
                            </Col>
                        </Row>
                        <Row>
                        <Col>
                        {buildTypeAheadComponent(supplierSearchEndpoint,_=>setSelectedItem(_[0]), selectedItem)()}
                        </Col>
                        </Row>
                  </Container>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="primary" onClick={()=>{
                        let updated_fields = buildItemFromMaster(selectedItem, {detail_location: newLocation});
                        handleChange(row.id, updated_fields)
                        handleCloseModify();
                        }}>Save Changes
                    </Button>
                    <Button variant="secondary" onClick={handleCloseModify}>Close</Button>
                </Modal.Footer>
            </Modal>
        </>);
    }
    const AddingModal = (props) =>{
        // state of the modal
        let {handleChange, supplierSearchEndpoint, itemId} = props;
        let positionToInsert = getRowById(commonData.items, itemId);
        let [selectedItem, setSelectedItem] = useState(null);
        let [newLocation, setNewLocation] = useState("");

        // component
        return (<>
        <Modal size="lg" show={showAddModify} onHide={handleCloseAddModify}>
                <Modal.Header>
                    <Modal.Title>Adding Item</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Container fluid>
                        {/**Body of the modal with TypeaheadRemote*/}
                        <Row>
                            <Col>
                            {table_helpers.buildGroupDetails(["detail_loc", "Position", "text","", newLocation, false, 
                            e=>{let inputValue = e.target.value;setNewLocation(inputValue);}])}
                            </Col>
                        </Row>
                        <Row>
                        <Col>
                        {buildTypeAheadComponent(supplierSearchEndpoint,_=>setSelectedItem(_[0]), selectedItem)()}
                        </Col>
                        </Row>
                  </Container>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="primary" onClick={()=>{
                        let location_fields = ["building","location"];
                        let location = location_fields.reduce((a, f)=>Object.assign(a, {[f]:commonData[f]}),{detail_location:newLocation});
                        let createdItem = buildItemFromMaster(selectedItem, location);
                        createdItem["counted"]=-1;
                        handleChange(createdItem, positionToInsert);
                        handleCloseAddModify();
                        }}>Add Item
                    </Button>
                    <Button variant="secondary" onClick={handleCloseAddModify}>Close</Button>
                </Modal.Footer>
            </Modal>
        </>);
    };
    const CountingModal =(props) =>{
        let {itemId, handleChange} = props;
        let rowIndex = getRowById(commonData.items, itemId);
        let row = commonData.items[rowIndex];
        let [detailCounted, setDetailCounted] = useState(row.detail_counted||"0");
        let [counted, setCounted] = useState(row.counted||"0");
        let [boxcount, setBoxcount] = useState(row.counted==-1?0:(row.counted-evaluate(row.detail_counted||0))/row.colisage_achat||0);
        const handleFocus = (event)=>{event.target.select()};
        const updateCounted = (boxCounted)=>{
            setBoxcount(boxCounted);
            setCounted(boxCounted*row.colisage_achat+evaluate(detailCounted));
        };
        return ( <>
            <Modal size="lg" show={show} onHide={handleClose}>
                <Modal.Header>
                    <Modal.Title>{row.itemcode}-{row.itemname}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Container fluid>
                        <Row>
                        <Col>
                            {table_helpers.buildGroupDetails(["puht","Prix Unit. HT", "text", "", parseFloat(row.pu_ht).toFixed(2), true, undefined, undefined,"-1"])}
                            </Col>
                            <Col>
                            {table_helpers.buildGroupDetails(["test-5","Codebarre", "text", "", row.codebars, true, undefined, undefined,"-1"])}
                            </Col>
                        </Row>
                        <Row>
                            <Col>
                            {table_helpers.buildGroupDetails(["test-6","Stock SAP", "text", "", row.onhand, true, undefined, undefined,"-1"])}
                            </Col>
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
                            {table_helpers.buildGroupDetails(["test-4","Colisage Vente", "text", "", row.colisage_vente, true, undefined, undefined,"-1"])}
                            </Col>
                            <Col>
                            {table_helpers.buildGroupDetails(["test-3","Colisage Achat", "text", "", row.colisage_achat, true, undefined, undefined,"-1"])}
                            </Col>
                            {react_helpers.displayIf(_=>row.pcb_pal>1, Col)(
                                {children:table_helpers.buildGroupDetails(["test-8","Colisage Pal", "text", "", row.pcb_pal, true, undefined, undefined,"-1"])}
                            )}
                        </Row>
                        <Row>
                            <Col>
                                {table_helpers.buildGroupDetails(["test-2","Eval", "text", "Eval Comptage", counted, true, undefined, undefined,"-1"])}
                            </Col>
                        </Row>
                        <Row>
                            <Col>
                            {table_helpers.buildGroupDetails(["nbcolis", "CT compté", "number", "Entrer nb ct", boxcount, false, e=>{updateCounted(e.target.value)}])}
                            </Col>
                            <Col>
                            {table_helpers.buildGroupDetails(["uvByColis", "UN/CT", "text","", row.colisage_achat, true,null,null,"-1"])}
                            </Col>
                            <Col>
                                {table_helpers.buildGroupDetails(["test-1","UV. compté", "text", "Entrer comptage", 
                                detailCounted, false, e=>{
                                    let inputValue = e.target.value;
                                    setDetailCounted(inputValue);
                                    let endOperator = some(["+","-", "/", "*"].map(_=> inputValue.endsWith(_)), Boolean);
                                    let evaluated = 0;
                                    if (endOperator){
                                        evaluated = evaluate(inputValue.substring(0,inputValue.length-1));
                                    }
                                    else {
                                        evaluated = evaluate(inputValue);
                                    }
                                    setCounted(boxcount*row.colisage_achat+evaluated);
                                }, handleFocus, "0"])}
                            </Col>
                      </Row>
                  </Container>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="primary" onClick={()=>{
                        let countedData = {counted: counted, detail_counted: detailCounted}
                        handleChange(row.id, countedData);
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
            <CreatableSelect
            defaultOptions
            cacheOptions
            options={alleysOptions}
            onChange={onChangeLocation}
            isSearchable
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
            <Dropdown.Item onClick={setRowIndexToModify}>Modify</Dropdown.Item>
            <Dropdown.Item 
            onClick={()=>{
                    setEditingRowId(selectedInTable.selected[0])
                    setShowAddModify(true);
                }
            }>Add</Dropdown.Item>
            <Dropdown.Divider/>
            <Dropdown.Item onClick={deleteItem}>Delete</Dropdown.Item>
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
        {react_helpers.displayIf(()=>show, Row)({children:(<CountingModal itemId={editingRowId} handleChange={updateItem}/>)})}
        {react_helpers.displayIf(()=>showModify, Row)({children:(<ModifyModal itemId={editingRowId} handleChange={updateItem} 
        supplierSearchEndpoint={itemSearchEndpoint}/>)})}
        {react_helpers.displayIf(()=>showAddModify, Row)({children:(<AddingModal itemId={editingRowId} handleChange={addItem} supplierSearchEndpoint={itemSearchEndpoint}/>)})}
    </Container>
    </>);
}