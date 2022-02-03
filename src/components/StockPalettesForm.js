import React, {useEffect, useState} from 'react';

import Button from 'react-bootstrap/Button';
import Alert from 'react-bootstrap/Alert'
import Spinner from 'react-bootstrap/Spinner'
import Container from 'react-bootstrap/Container'
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col';

import BootstrapTable from 'react-bootstrap-table-next';


import table_helpers from '../utils/bootstrap_table';
import react_helpers from "../utils/react_helpers";
import common_helpers from '../utils/common';
import ConfigApi from "../config.json";
require('moment/locale/fr.js');
import moment from 'moment';
moment.locale('fr');

import UpdateModal from './modals/UpdateModal';

const BASE_URL = ConfigApi.API_URL;
const ITEMS_SEARCH_URL = `${BASE_URL}/items`;
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
const isoFormat = 'YYYY-MM-DDTHH:mm:ss.sssZ';
export default function StockPalettesForm(props) {
    const [selected, setSelected] = useState(null);   // Item selected via typeahead component
    const [editingRowIndex, setEditingRowIndex] = useState(null);
    const [itemsInTable, setItemsInTable] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [showResultAlert, setShowResultAlert] = useState(false);
    const [show, setShow] = useState(false);
    const [refresh, setRefresh] = useState(false);
    const [currentStock, setCurrentStock] = useState("");
    const columns = table_helpers.buildColumnData(dataFields, dataLabels);
    const typeaheadRef = React.createRef();
    const ItemDAO = common_helpers.buildDao(`${INVENTORY_URL}/api/items`);

    useEffect(()=>{
        let refreshItemsState = async () =>{
            if(refresh) {
                fetchItems({itemcode: selected.itemcode})
                .then(response => setRefresh(false));
            }
        };
        refreshItemsState();
    },[refresh]);
    const resetStates = () =>{
        setSelected(null);
        setItemsInTable([]);
        setIsLoading(false);
        setShowResultAlert(false);
        setCurrentStock("")
    };
    const clearTypeahead = ()=>{
        resetStates();
        typeaheadRef.current.clear();
        typeaheadRef.current.focus();
    };

    const fetchItemFromMaster = (itemcode) => {
        let searchEndpoint = `${ITEMS_SEARCH_URL}/${itemcode}`
        return fetch(searchEndpoint)
        .then((resp) => resp.json());
    }

    const fetchItems  = (params)=>{
        return ItemDAO.fetchItems(params)
               .then(response=>{
                   setItemsInTable(response.data);
                   setIsLoading(false);
                   if(response.data.length==0) setShowResultAlert(true);
                   return response;
            });
    };
    // table handling functions
    const handleSelected = (selected) => {
        let item = selected[0];
        setSelected(item);
        if(selected && item) {
            setIsLoading(true);
            fetchItems({itemcode: item.itemcode, itemname: item.itemname});
            fetchItemFromMaster(item.itemcode).then(items => setCurrentStock(items[0].onhand))
        }
    }
    const _buildItemSearchEndpoint = (base_url) =>{
        return query => {
            let numberPattern = /^\d{6,}$/g;
            let _base_url = ConfigApi.INVENTORY_URL;
            let result_url=`${_base_url}/api/items/search?itemname=`;
            if(query.match(numberPattern)){
                result_url = `${base_url}/items/`;
            }
            return `${result_url}${query}`;
        };
    }

    const itemsSearchEndpoint = _buildItemSearchEndpoint(BASE_URL);//common_helpers.buildItemSearchEndpoint(BASE_URL);
    
    const rowEvents = {
        onClick: (e, row, rowIndex) => {
            setEditingRowIndex(rowIndex);
            setShow(true);
        },
    };
    const existsAndLengthGtZero = common_helpers.existsAndPredicate(_=>_.length>0);
    const rowStyle = (row, rowIndex) => {
        const style = {};
        if (existsAndLengthGtZero("comments")(row)) {
            style.backgroundColor = '#ffcc99'; // color peach orange
        }
        return style;
    };
    const rowRenderer = (row) =>{
        return (
            <Container>
                <Row>
                    <Col>
                    {table_helpers.buildGroupDetails(["updated", "Mis à jour", "text", "", moment(row.updatedAt,isoFormat).fromNow(), true, undefined, undefined, "-1"])}
                    </Col>
                    {row.dluo.length>0?
                    (
                    <Col>
                    {table_helpers.buildGroupDetails(["dluo", "DLUO", "text", "", row.dluo, true, undefined, undefined, "-1"])}
                    </Col>
                    )
                :null}
                </Row>
                {row.comments.length>0?
                (<Row>
                    <Col>
                    {table_helpers.buildGroupDetails(["comments", "Commentaire", "text", "", row.comments, true, undefined, undefined, "-1"])}
                    </Col>
                </Row>)
                :null}
            </Container>
        )
    }
    const expandRow = {
        renderer: rowRenderer,
        showExpandColumn: true,
        expandByColumnOnly: true,
        onlyOneExpanding: true,
        expandHeaderColumnRenderer: table_helpers.expandHeaderColumnRenderer,
        expandColumnRenderer: table_helpers.expandColumnRenderer
    };
    const updateItem = (item_id, updated_fields) => {
        return ItemDAO.updateItemInDB(item_id, updated_fields)
        .then(response => {
            if(response && response.status==200) {
                fetchItems({itemcode: selected.itemcode});
            }
            return response;
        });
    };
    const handleClose = () => {setShow(false);setIsLoading(false);};
    return (<>
    <Container fluid>
        <Row>
        <Col xs={6}>
            <Button variant="warning" onClick={clearTypeahead}>Clear</Button>
            {react_helpers.displayIf(()=>isLoading, Spinner)({animation:"border", role:"status"})}
        </Col>
        {selected?
        <Col>Stock total: {currentStock}</Col>
        :null}
        {itemsInTable.length>0?
        <Col>Stock cumul: {itemsInTable.reduce((sum, item)=>item.counted>0?sum+item.counted:sum,0)}</Col>
        :null}
        </Row>
        <Row>
            <Col>
            {react_helpers.displayIf(()=>showResultAlert, Alert)({variant:"info", children:"Article introuvable"})}
            </Col>
        </Row>
        <Row>
            <Col>
            {common_helpers.buildTypeAheadComponent(itemsSearchEndpoint, handleSelected, selected)({forwardRef:typeaheadRef})}
            </Col>
        </Row>
        <Row>
            <Col>
            {react_helpers.displayIf(()=>selected && itemsInTable.length>0, BootstrapTable)({
                 keyField:"id"
                 ,data:itemsInTable
                 ,columns:columns
                 ,rowEvents:rowEvents
                 ,rowStyle:rowStyle
                 ,expandRow:expandRow
            })}
            </Col>
        </Row>
        {react_helpers.displayIf(()=>show, Row)({children:(<UpdateModal item={itemsInTable[editingRowIndex]}
        itemDao = {ItemDAO}
        handleChange={updateItem} setRefresh={setRefresh}
        notifyLoading={setIsLoading} show={show} handleClose={handleClose}/>)})}
    </Container>
    </>)
}