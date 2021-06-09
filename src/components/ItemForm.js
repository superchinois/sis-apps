import React, { useState, useEffect } from 'react';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import TypeaheadRemote from '../components/TypeaheadRemote';
import Alert from 'react-bootstrap/Alert'

import BootstrapTable from 'react-bootstrap-table-next';
import cellEditFactory from 'react-bootstrap-table2-editor';

import Container from 'react-bootstrap/Container'
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col';

import { zipObject } from 'lodash';
import { v4 as uuidv4 } from 'uuid';

//import io from 'socket.io-client';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import ConfigApi from "../config.json";
import axios from 'axios';
import table_helpers from '../utils/bootstrap_table';
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
const dataLabels = ["dataField", "text", "hidden", "editable"];
const API_URL = ConfigApi.API_URL;
const SEARCH_URL = `${API_URL}/items?search=`;

export default function ItemForm(props) {
  const [selected, setSelected] = useState(null);
  const [products, setProducts] = useState([]);
  const [state, setState] = useState({ selected: [] });
  const columns = table_helpers.buildColumnData(dataFields, dataLabels);
  const typeaheadRef = React.createRef();
  //  const socket = io(ConfigApi.WS_TASK_STATUS_URL);
  /*   useEffect(() => {
      socket.on('connect', ()=>{console.log("connected");});
      socket.on('task status', (data) => {
        console.log(data);
        toast(data.status);
      });
      socket.on('disconnect', ()=>{console.log("connected");});
    }, []); */

  const handleSelected = (selected) => {
    setSelected(selected[0]);
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
    let userid = uuidv4();
    let test_url = "http://localhost:5000/longtask";
    axios({ method: "post", url: test_url, data: { userid: userid } })
      .then(response => {
        console.log(response.status, response.data);
      });
  };

  const selectRow = {
    mode: 'checkbox',
    clickToSelect: false,
    clickToExpand: false,
    selected: state.selected,
    onSelect: table_helpers.buildHandleOnSelect(state, setState),
    onSelectAll: table_helpers.buildHandleAllOnSelect(setState)
  };
  const expandRow = {
    renderer: row => {
      return (
        <div>
          <p>{`This Expand row is belong to rowKey ${row.id}`}</p>
          <p>You can render anything here, also you can add additional data on every row object</p>
          <p>expandRow.renderer callback will pass the origin row object to you</p>
        </div>
      )
    },
    showExpandColumn: true,
    expandByColumnOnly: true,
    onlyOneExpanding: true
  };
  const cellEdit = cellEditFactory({
    mode: 'click',
    blurToSave: true,
    //beforeSaveCell: (oldValue, newValue, row, column) => { console.log("beforSaveCell"); console.log(oldValue, newValue, row, column) },
    //afterSaveCell: (oldValue, newValue, row, column) => { console.log("afterSaveCell"); console.log(oldValue, newValue, row, column) },
  });
  return (
    <div style={myStyle}>
      <ToastContainer />
      {/* <MyTypeahead forwardRef={typeaheadRef} handleSelected={handleSelected} selected={selected} clearButton /> */}
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
        clearButton
        />
      {selected ?
        (
          <Form onSubmit={handleSubmit}>
            <Form.Row>
              <Form.Group controlId="itemcode" as={Col}>
                <Form.Label>Itemcode</Form.Label>
                <Form.Control type="text"
                  placeholder="Enter itemcode"
                  value={selected.itemcode}
                  readOnly tabIndex="-1" />
              </Form.Group>

              <Form.Group controlId="pu_ttc" as={Col}>
                <Form.Label>Pu TTC</Form.Label>
                <Form.Control type="text" placeholder="puttc" value={toIncVatPrice(selected.vente, selected.rate) + "€"}
                  readOnly tabIndex="-1" />
              </Form.Group>
              <Form.Group controlId="pack_ttc" as={Col}>
                <Form.Label>Pack TTC</Form.Label>
                <Form.Control type="text" placeholder="puttc"
                  value={pricePackTtc(toIncVatPrice(selected.vente, selected.rate), selected.pcb_vente) + "€"}
                  readOnly tabIndex="-1" />
              </Form.Group>
            </Form.Row>
            <Form.Row>
              <Form.Group controlId="codebar" as={Col}>
                <Form.Label>Codebar</Form.Label>
                <Form.Control type="text" placeholder="Codebar" value={selected.codebars ? selected.codebars : "N/A"} readOnly tabIndex="-1" />
              </Form.Group>
              <Form.Group controlId="onhand" as={Col}>
                <Form.Label>Stock Actuel</Form.Label>
                <Form.Control type="text" value={selected.onhand} readOnly tabIndex="-1" />
              </Form.Group>
            </Form.Row>
            <Button variant="primary" type="submit">
              Submit
                </Button>
          </Form>
        ) : <Alert variant="info">No Item Selected yet !</Alert>}
      <div>
        {products.length > 0 ?
          (
            <>
              <Container fluid>
                <Row>
                  <Col>
                    <Button variant="warning" onClick={handleBtnClick}>Delete</Button>
                  </Col>
                  {/* <Col>
                  <Button variant="primary" onClick={handleTestBtn}>Test Long Task</Button>
                  </Col> */}
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
    </div>
  );
}