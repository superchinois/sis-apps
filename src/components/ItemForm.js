import React, { useState, useReducer } from 'react';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import TypeaheadRemote from '../components/TypeaheadRemote';
import Alert from 'react-bootstrap/Alert'

import BootstrapTable from 'react-bootstrap-table-next';
import cellEditFactory from 'react-bootstrap-table2-editor';

import Container from 'react-bootstrap/Container'
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col';
import Spinner from 'react-bootstrap/Spinner'

//import io from 'socket.io-client';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import ConfigApi from "../config.json";
import table_helpers from '../utils/bootstrap_table';
import react_helpers from "../utils/react_helpers";
import common_helpers from '../utils/common';
const myStyle = { padding: "10px 10px 10px 10px" };

const toIncVatPrice = (price, tva) => parseFloat(price * (1 + tva / 100)).toFixed(2);
const pricePackTtc = (price, saleFactor) => parseFloat(price * saleFactor).toFixed(2);

const falseFn = (content, row, rowIndex, columnIndex) => false;
const dataFields = [
  ["id", "ID", true, falseFn],
  ["itemcode", "Itemcode", false, falseFn],
  ["itemname", "Dscription", false, falseFn],
  ["quantity", "Quantité", false, (content, row, rowIndex, columnIndex) => true]
];

const dataInventoryFields = [
  ["id", "ID", true, falseFn, "center", false],
  ["building", "batiment", false, falseFn, "center", true],
  ["location", "emplacement", false, falseFn, "center", true],
  ["detail_location", "place", false, falseFn, "center", true],
  ["counted", "quantité", false, falseFn, "center", true]
];

const dataLabels = ["dataField", "text", "hidden", "editable"];
const API_URL = ConfigApi.API_URL;
const INVENTORY_URL=ConfigApi.INVENTORY_URL;
const SEARCH_URL = `${API_URL}/items?search=`;
const fetchData = (url,outputName,callback) => common_helpers.downloadExcelFile({method: "GET"})(url,outputName,{}, callback);
const initialData = {historique:false, pallet:false}
const isLoadingReducer = react_helpers.dataReducer(initialData);
export default function ItemForm(props) {
  const [selected, setSelected] = useState(null);
  const [products, setProducts] = useState([]);
  const [state, setState] = useState({ selected: [] });
  let   [isLoading, dispatch] = useReducer(isLoadingReducer, initialData);
  const [itemsInPallet, setItemsInPallet] =useState([]);
  const [isFetchedInventory, setIsFetchedInventory] = useState(false);
  const columns = table_helpers.buildColumnData(dataFields, dataLabels);
  const inventory_cols = table_helpers.buildColumnData(dataInventoryFields, [...dataLabels, "headerAlign", "sort"]);
  const typeaheadRef = React.createRef();
  const ItemDAO = common_helpers.buildDao(`${INVENTORY_URL}/api/items`);
  //  const socket = io(ConfigApi.WS_TASK_STATUS_URL);
  /*   useEffect(() => {
      socket.on('connect', ()=>{console.log("connected");});
      socket.on('task status', (data) => {
        console.log(data);
        toast(data.status);
      });
      socket.on('disconnect', ()=>{console.log("connected");});
    }, []); */
  const resetStates = () =>{
      setSelected(null);
      setItemsInPallet([]);
      dispatch({type:'RESET_DATA'});
      setProducts([]);
      setIsFetchedInventory(false);
  };
  
  const clearTypeahead = ()=>{
    resetStates();
    typeaheadRef.current.clear();
    typeaheadRef.current.focus();
  };

  const handleSelected = (selected) => {
    if(selected.length>0){
      setSelected(selected[0]);
    }
    else {
      resetStates();
    }
  }

  const handleSubmit = (event) => {
    let current_id = products.length == 0 ? 0 : products.slice(-1)[0].id + 1;
    setProducts([...products, { ...selected, id: current_id, quantity: 0 }]);
    setSelected(null);
    typeaheadRef.current.clear();
    typeaheadRef.current.focus();
    event.preventDefault();
  }
  const handleBtnClick = () => {
    let remaining = products.filter((item) => !state.selected.includes(item.id));
    setProducts(remaining);
    setState({ selected: [] });
  }

  const handleTestBtn = () => {
    dispatch({type: 'ADD_DATA', id:"historique", data:true});
    let url = (itemcode) => `${ConfigApi.API_URL}/items/historique/${itemcode}`;
    fetchData(url(selected.itemcode), `${selected.itemname.replace(/ /g, "_")}`, () => dispatch({type: 'ADD_DATA', id:"historique", data:false}))
  };

  const handlePalletBtn = () => {
    dispatch({type: 'ADD_DATA', id:"pallet", data:true});
    ItemDAO.fetchItems({itemcode: selected.itemcode})
    .then(response => {
      dispatch({type: 'ADD_DATA', id:"pallet", data:false});
      setIsFetchedInventory(true);
      setItemsInPallet(response.data);
    });
  }

  const selectRow = {
    mode: 'checkbox',
    clickToSelect: false,
    clickToExpand: false,
    selected: state.selected,
    onSelect: table_helpers.buildHandleOnSelect(()=>state, setState),
    onSelectAll: table_helpers.buildHandleAllOnSelect(setState)
  };
  const existsAndPredicate = common_helpers.existsAndPredicate;
  const rowStyle = (row, rowIndex) => {
    const style = {};
    if (existsAndPredicate(_=>_.length>0)("comments")(row)) {
        style.backgroundColor = '#ffcc99'; // color peach orange
    }
    return style;
  };
  const cellEdit = cellEditFactory({
    mode: 'click',
    blurToSave: true,
  });
  return (
    <div style={myStyle}>
      <Container>
        <Row>
        <Col xs={6}>
            <Button variant="warning" onClick={clearTypeahead}>Clear</Button>
        </Col>
        </Row>
        <Row>
          <Col>
        <TypeaheadRemote
          forwardRef={typeaheadRef}
          handleSelected={handleSelected}
          selected={selected}
          searchEndpoint={query => {
            let numberPattern = /^\d{6,}$/g;
            if(query.match(numberPattern)){
              return `${API_URL}/items/${query}`;
            }
          return `${SEARCH_URL}${query}`;
          }}
          placeholder="Rechercher article ou code ..."
          labelKey={option => `${option.itemname}`}
          renderMenuItem={(option, props) => (
            <div>
              <span style={{whiteSpace:"initial"}}><div style={{fontWeight:"bold"}}>{option.itemcode}</div> - {option.itemname} - {option.onhand}</span>
            </div>
          )}
        />
        </Col>
        </Row>
        <Row>
          <Col>
          {selected ?
        (
          <Form onSubmit={handleSubmit}>
            <Row>
              <Col>
              {table_helpers.buildGroupDetails(["itemcode", "Itemcode", "text", "Enter itemcode", selected.itemcode, true, undefined, undefined, "-1"])}
              </Col>
              <Col>
              {table_helpers.buildGroupDetails(["pu_ttc", "Pu TTC", "text", "", toIncVatPrice(selected.vente, selected.rate) + "€", true, undefined, undefined, "-1"])}
              </Col>
              <Col>
              {table_helpers.buildGroupDetails(["pack_ttc", "Pack TTC", "text", "", pricePackTtc(toIncVatPrice(selected.vente, selected.rate), selected.pcb_vente) + "€"
              , true, undefined, undefined, "-1"])}
              </Col>
            </Row>

            <Row>
              <Col>
              {table_helpers.buildGroupDetails(["pcb_vente", "Col. Vente", "text", "", selected.pcb_vente, true, undefined, undefined, "-1"])}
              </Col>
              <Col>
              {table_helpers.buildGroupDetails(["pcb_achat", "Col. Achat", "text", "", selected.pcb_achat, true, undefined, undefined, "-1"])}
              </Col>
              <Col>
              {table_helpers.buildGroupDetails(["pcb_pal", "Col. Pal", "text", "", selected.pcb_pal, true, undefined, undefined, "-1"])}
              </Col>
            </Row>
            <Row>
              <Col>
              {table_helpers.buildGroupDetails(["codebar", "Codebar", "text", "", selected.codebars ? selected.codebars : "N/A", true, undefined, undefined, "-1"])}
              </Col>
              <Col>
              {table_helpers.buildGroupDetails(["onhand", "Stock Actuel", "text", "", selected.onhand, true, undefined, undefined, "-1"])}
              </Col>
            </Row>
            <Row>
            <Col>
              <Button variant="primary" type="submit">
                Submit
              </Button>
            </Col>
            <Col>
              <Button variant="primary" onClick={handleTestBtn}>Historique</Button>
              {react_helpers.displayIf(()=>isLoading["historique"], Spinner)({animation:"border", role:"status"})}
            </Col>
            <Col>
            <Button variant="primary" onClick={handlePalletBtn}>Pallets</Button>
              {react_helpers.displayIf(()=>isLoading["pallet"], Spinner)({animation:"border", role:"status"})}
            </Col>
            </Row>
          </Form>
        ) : <Alert variant="info">No Item Selected yet !</Alert>}

          </Col>
        </Row>
        <Row>
          <Col>
          <div>
        {products.length > 0 ?
          (
            <>
              <Container fluid>
                <Row>
                  <Col>
                    <Button variant="warning" onClick={handleBtnClick}>Delete</Button>
                  </Col>
                </Row>
              </Container>

              <BootstrapTable
                keyField="id"
                data={products}
                columns={columns}
                selectRow={selectRow}
                cellEdit={cellEdit} />
            </>
          ) : null}
      </div>
          </Col>
        </Row>
        <Row>
          <Col>
          <Row>
            <Col>
            {react_helpers.displayIf(()=>selected && itemsInPallet.length>0, BootstrapTable)({
                keyField:"id"
                ,data:itemsInPallet
                ,rowStyle:rowStyle
                ,columns:inventory_cols
              })
            }
            </Col>
          </Row>
          <Row>
          {react_helpers.displayIf(()=>selected && isFetchedInventory && itemsInPallet.length==0, Alert)({
            variant:"info", children: "No Pallet Location in Database"})}
          </Row>
          </Col>
        </Row>
      </Container>
    </div>
  );
}