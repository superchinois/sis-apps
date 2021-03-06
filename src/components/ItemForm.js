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
import axios from 'axios';

import ConfigApi from "../config.json";
import table_helpers from '../utils/bootstrap_table';
import react_helpers from "../utils/react_helpers";
import common_helpers from '../utils/common';
const myStyle = { padding: "10px 10px 10px 10px" };

const toIncVatPrice = (price, tva) => parseFloat(price * (1 + tva / 100)).toFixed(2);
const pricePackTtc = (price, saleFactor) => parseFloat(price * saleFactor).toFixed(2);
const shortIsoStringDate = (dateString) => dateString.split("T")[0];

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

const receptionsFields = [
  ["docdate", "Date Recep.", false, falseFn],
  ["quantity", "Quantité", false, falseFn],
  ["u_dluo", "DLUO", false, falseFn],
  ["comments", "Commentaires", false, falseFn],
]

const dataLabels = ["dataField", "text", "hidden", "editable"];
const API_URL = ConfigApi.API_URL;
const INVENTORY_URL=ConfigApi.INVENTORY_URL;
const SEARCH_URL = `${API_URL}/items?search=`;
const fetchData = (url,outputName,callback) => common_helpers.downloadExcelFile({method: "GET"})(url,outputName,{}, callback);
const initialData = {historique:false, pallet:false, reception:false, codebar:false}
const isLoadingReducer = react_helpers.dataReducer(initialData);
export default function ItemForm(props) {
  const [selected, setSelected] = useState(null);
  const [codebar, setCodebar] = useState("");
  const [products, setProducts] = useState([]);
  const [state, setState] = useState({ selected: [] });
  let   [isLoading, dispatch] = useReducer(isLoadingReducer, initialData);
  const [itemsInPallet, setItemsInPallet] =useState([]);
  const [receptionRows, setReceptionRows] = useState([]);
  const [isFetchedInventory, setIsFetchedInventory] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");

  const columns = table_helpers.buildColumnData(dataFields, dataLabels);
  const inventory_cols = table_helpers.buildColumnData(dataInventoryFields, [...dataLabels, "headerAlign", "sort"]);
  const receptions_cols = table_helpers.buildColumnData(receptionsFields, dataLabels);
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
  const setLoadingTrue  = (reducerField) => dispatch({type:'ADD_DATA', id:reducerField, data:true})
  const setLoadingFalse = (reducerField) => dispatch({type:'ADD_DATA', id:reducerField, data:false})
  
  const resetStates = () =>{
      setSelected(null);
      setCodebar("");
      setItemsInPallet([]);
      dispatch({type:'RESET_DATA'});
      setIsFetchedInventory(false);
      setReceptionRows([]);
  };
  
  const clearTypeahead = ()=>{
    resetStates();
    typeaheadRef.current.clear();
    typeaheadRef.current.focus();
  };

  const handleSelected = (selected) => {
    if(selected.length>0){
      setSelected(selected[0]);
      setCodebar(selected[0].codebars);
    }
    else {
      resetStates();
    }
  }

  const handleCodebarSubmit = () =>{
    if (selected !== null) {
      let codebar_endpoint = `${ConfigApi.SERVICES_API_URL}/codebar`;
      let itemcode = selected.itemcode;
      let post_data = {itemcode: itemcode, codebar: codebar};
      setLoadingTrue("codebar");
      axios({ method: "post", url: codebar_endpoint, data: post_data })
            .then(response => {
                if (response.status == 200) {
                  setAlertMessage("200 update ok");
                }
                if (response.status == 500) {
                  setAlertMessage("500 Internal Server Error");
                }
                setLoadingFalse("codebar");
            });
    }
   
  };
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
    setLoadingTrue("historique");
    let url = (itemcode) => `${ConfigApi.API_URL}/items/historique/${itemcode}`;
    fetchData(url(selected.itemcode), `${selected.itemname.replace(/ /g, "_")}`, () => setLoadingFalse("historique"));
  };

  const handlePalletBtn = () => {
    setLoadingTrue("pallet")
    ItemDAO.fetchItems({itemcode: selected.itemcode})
    .then(response => {
      setLoadingFalse("pallet");
      setIsFetchedInventory(true);
      setItemsInPallet(response.data);
    });
  }

  const handleReceptionsBtn = () =>{
    setLoadingTrue("reception");
    let url = (itemcode) => `${API_URL}/items/receptions/${itemcode}`;
    common_helpers.simpleJsonGet(url(selected.itemcode)).then(receptions=>{
      setLoadingFalse("reception");
      let date_fields=["docdate", "u_dluo"];
      let new_receptions = receptions.map(row=>{
        return Object.entries(row).reduce((acc, entry)=>{
          let [key, value] = entry;
          if (date_fields.includes(key)){
            value = value?shortIsoStringDate(value):"";
          }
          return Object.assign(acc, {[key]:value});
        }, {});
      })
      setReceptionRows(new_receptions);
    })
  }
  const onCodebarChange = (event)=>{
    let codebar_value = event.target.value;
    setCodebar(codebar_value);
  };
  const selectRow = {
    mode: 'checkbox',
    clickToSelect: false,
    clickToExpand: false,
    selected: state.selected,
    onSelect: table_helpers.buildHandleOnSelect(()=>state, setState),
    onSelectAll: table_helpers.buildHandleAllOnSelect(setState)
  };

  const rowStyle = table_helpers.rowStyleColors;
  
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
              {table_helpers.buildGroupDetails(["codebar", "Codebar", "text", "", codebar, false, onCodebarChange, undefined, "-1"])}
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
            <Col>
            <Button variant="primary" onClick={handleReceptionsBtn}>Receptions</Button>
              {react_helpers.displayIf(()=>isLoading["reception"], Spinner)({animation:"border", role:"status"})}
            </Col>
            <Col>
            <Button variant="secondary" onClick={handleCodebarSubmit}>Maj codebar</Button>
              {react_helpers.displayIf(()=>isLoading["codebar"], Spinner)({animation:"border", role:"status"})}
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
        <Row>
          <Col>
          <Row>
            <Col>
            {react_helpers.displayIf(()=>selected && receptionRows.length>0, BootstrapTable)({
                keyField:"docdate"
                ,data:receptionRows
                ,columns:receptions_cols
              })
            }
            </Col>
          </Row>
          </Col>
        </Row>
      </Container>
    </div>
  );
}