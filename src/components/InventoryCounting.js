import React, { useState, useEffect, useReducer } from 'react';

import Button from 'react-bootstrap/Button';
import Container from 'react-bootstrap/Container'
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col';
import Spinner from 'react-bootstrap/Spinner'
import DropdownButton from 'react-bootstrap/DropdownButton';
import Dropdown from 'react-bootstrap/Dropdown';

import BootstrapTable from 'react-bootstrap-table-next';
import {sortBy} from 'lodash';
import axios from 'axios';
import CreatableSelect from 'react-select/creatable';
import table_helpers from '../utils/bootstrap_table';
import react_helpers from '../utils/react_helpers';
import ConfigApi from "../config.json";
import AddingModal from './modals/AddingModal';
import ModifyModal from './modals/ModifyModal';
import CountingModal from './modals/CountingModal';
import common_helpers from '../utils/common';

const BASE_URL = ConfigApi.INVENTORY_URL;
const API_URL = ConfigApi.API_URL;
const SEARCH_URL = `${API_URL}/items?search=`;
const falseFn = table_helpers.falseFn;
const dataFields = [
    ["id", "ID", true, falseFn],
    ["detail_location", "place", false, falseFn],
    ["itemcode", "Code", false, falseFn],
    ["itemname", "Dscription", false, falseFn],
    ["counted", "Compté", false, falseFn]
];
const dataLabels = ["dataField", "text", "hidden", "editable"];
const getRowById = react_helpers.getRowById;
const initialData = {building: "", location:"", counted_by:"", items:[]};
const commonDataReducer = react_helpers.dataReducer(initialData);

const itemSearchEndpoint = common_helpers.buildItemSearchEndpoint(API_URL);
const MINIMUM_NAME_LENGTH=2
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
    const itemDao = common_helpers.buildDao(`${BASE_URL}/api/items`);

    const [scrollYPosition, setScrollYPosition] = useState(0);
    const [lastYPosition, setLastYPosition] = useState(0);
    const handleScroll = () => {
        const position = window.pageYOffset;
        setScrollYPosition(position);
    };
    const scrollToPosition = (yPosition) => {
        window.scrollTo({
            top: yPosition, 
            left: 0, 
            behavior: "smooth"
        });
    }
    useEffect(() => {
        window.addEventListener("scroll", handleScroll);
        return () => {
            window.removeEventListener("scroll", handleScroll);
        };
        }
        ,[]
    );
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
    const handleClose = () => {setShow(false);setIsLoading(false);resetCheckboxes()};
    const handleCloseModify = () => {setShowModify(false);resetCheckboxes();scrollToPosition(lastYPosition)};
    const handleCloseAddModify = () => {setShowAddModify(false);resetCheckboxes();scrollToPosition(lastYPosition)};
    const handleShow = () => setShow(true);

    const getItemFromId = (item_id) =>{
        let item_index = getRowById(commonData.items, item_id);
        return commonData.items[item_index];
    }
    const fetchLocationsByBuilding = (building) =>{
        let alleys_url=`${BASE_URL}/api/alleys_levels`;
        let params = {building:building};
        axios({method:"get", url: alleys_url, params:params})
        .then(response =>{
            let result = response.data.map(_=>{return {value: _, label:_};});
            setAlleysOptions(result);
        });
    };
    const fetchItemsByLocation = (location) =>{
        let items_url=`${BASE_URL}/api/items`;
        if(commonData.building.length>0){
            axios({method:"get", url:items_url, params:{building: commonData.building, location:location}})
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
        filtered.forEach(item=>itemDao.updateItemInDB(item.id, {position:item.position}));
        return result;
    };
    const addItem = (item, positionInTable) =>{
        return itemDao.createItemInDb(item)
        .then(response=>{
            let item_id = response.data.item.id;
            item["id"] = item_id;
            let updated_items = addItemToCommon(commonData.items, {...item, isNewlyUpdated:true}, positionInTable);
            updateCommonData("items", updated_items);
            return response;
        })
        .catch(console.log);
    };
    const updateItem = (item_id, updated_values)=>{
        updateCommonItems(item_id, updated_values);
        return itemDao.updateItemInDB(item_id, {...updated_values, counted_by:commonData.counted_by||""});
    };
    const deleteItem = () =>{
        let item_ids = selectedInTable.selected;
        updateCommonData("items", commonData.items.filter(_=>!item_ids.includes(_.id)));
        item_ids.forEach((id) =>{
            itemDao.deleteItemInDb(id);
        });
        resetCheckboxes();
    };
    const handleFetchBtn= ()=>{setIsLoading(true);fetchItemsByLocation(commonData.location);};
    const updateCommonData = (id, data) =>  dispatch({type:'ADD_DATA', id:id, data:data});;
    const updateCommonItems = (id, data) => {
        let updated_data = Object.assign({}, data);
        if ("itemcode" in updated_data) {
            updated_data = {...updated_data, isNewlyUpdated:true}
        }
        dispatch({type: 'UPDATE_ITEMS', item_id:id, data:updated_data})
    };
    const onChangeBuilding = (newValue, actionMeta) => {
        let selectedBuilding = newValue.value;
        updateCommonData("building", selectedBuilding);
        fetchLocationsByBuilding(selectedBuilding);
    };
    const onChangeLocation = (newValue, actionMeta) => {
        let selectedLocation = newValue.value;
        updateCommonData("location", selectedLocation);
        setIsLoading(true);
        fetchItemsByLocation(selectedLocation)};

    const rowStyle2 = (row, rowIndex) => {
        const style = {};
        if (row.counted > 0) {
            style.backgroundColor = '#c8e6c9'; // color green
        }
        if (row.counted == 0) {
            style.backgroundColor = '#ffcc99'; // color peach orange
        }
        if ("isNewlyUpdated" in row) {
            style.fontWeight="bold";
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
        onSelect: (row, isSelect)=>{
            setLastYPosition(scrollYPosition);
            table_helpers.buildHandleOnSelect(()=>selectedInTable,setSelectedInTable)(row, isSelect)
        },
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
    return(<>
    <Container fluid>
        <Row>
            <Col>
            {table_helpers.buildGroupDetails(["counted_by","Compté par","text", "Entrer prenom du compteur", commonData.counted_by, false, 
             e=>updateCommonData("counted_by", e.target.value)])}
            </Col>
        </Row>
        {commonData.counted_by && commonData.counted_by.length>MINIMUM_NAME_LENGTH ?
        <>
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
                <Button variant="primary" onClick={handleFetchBtn}>Refresh</Button>
                {react_helpers.displayIf(()=>isLoading, Spinner)({animation:"border", role:"status"})}
            </Col>
            <Col>
            <DropdownButton id="dropdown-basic-button" title="Actions" tabIndex="-1">
            <Dropdown.Item style={{padding: "0.65rem 1.5rem"}} onClick={setRowIndexToModify}>Modify</Dropdown.Item>
            <Dropdown.Item
            style={{padding: "0.65rem 1.5rem"}}
            onClick={()=>{
                    setEditingRowId(selectedInTable.selected[0])
                    setShowAddModify(true);
                }
            }>Add above</Dropdown.Item>
            <Dropdown.Divider/>
            <Dropdown.Item onClick={deleteItem}>Delete</Dropdown.Item>
        </DropdownButton>
            </Col>
        </Row>
        </>
        :null
        }
        
        <Row>
            <Col>
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
            </Col>
        </Row>
        {show&&!isLoading?
        <Row>
            <CountingModal item={getItemFromId(editingRowId)} 
            handleChange={updateItem} 
            counted_by={commonData.counted_by} show={show} handleClose={handleClose} notifyLoading={setIsLoading}/>
        </Row>
        :null}
        {react_helpers.displayIf(()=>showModify, Row)({children:(<ModifyModal item={getItemFromId(editingRowId)} handleChange={updateItem} 
        searchEndpoint={itemSearchEndpoint} show={showModify} handleClose={handleCloseModify}/>)})}
        {react_helpers.displayIf(()=>showAddModify&&!isLoading, Row)({children:(
        <AddingModal positionToInsert={getRowById(commonData.items, editingRowId)} 
                    locationData={commonData} 
                    handleChange={addItem} 
                    searchEndpoint={itemSearchEndpoint}
                    show={showAddModify} handleClose={handleCloseAddModify} notifyLoading={setIsLoading}/>)})}
    </Container>
    </>);
}