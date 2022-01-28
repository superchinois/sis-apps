import React, { Fragment, useState } from 'react'
import Breadcrumb from 'react-bootstrap/Breadcrumb'
//import dog from '../assets/images/dog.png'
//import ItemDetails from '../components/ItemDetails'
import TagSpoi from '../components/tags/TagSpoi'
import Form from 'react-bootstrap/Form'
var Papa = require("papaparse");
import { range, zipObject } from "lodash";
import csv_helpers from "../utils/processCsv";

const tagData = {
  itemcode: "722006",
  itemname: "BARQUETTE CHARCUTIERE 500CC x 250",
  side: "",
  cbcss: "ean13",
  cbtype: "ean13",
  pu_ht: "12.36",
};
const test_tag = {
  client_name:"220 - RUN MARKET STE MARIE - SAS MAKE DISTRIBUTION", 
  tour: "T89",
  current_tray:1,
  total_trays:1,
  items:[ {itemname:"Soja300g", quantity:15},
          {itemname: "Mac350g", quantity: 6},
          {itemname:"Soja300g", quantity:15},
          {itemname: "Mine1kg", quantity: 6},
          {itemname:"Soja300g", quantity:15},
          {itemname: "Mac350g", quantity: 6},
          {itemname:"Soja300g", quantity:15},
          {itemname: "Mac350g", quantity: 6},
        ]
};
const order_fields=["client_name", "tour", "total_trays"]
const item_fields=[
  "Soja300g","Soja500g","Soja600g","Soja5kg","Soja10kg",
  "Mine500g","Mine1kg","MineLot2","Tag300g","Tag500g","Mac350g",
  "Fett350g","Penn300g","Tort350g"
]
const About = (props) => {
  const [orders, setOrders] = useState([]);
  const handleChange = (event) => {
    let filePath = event.target.files[0];
    csv_helpers.loadCsvFromFile(filePath).then(data=>{
      let extract = data.map(row => {
        let order_first_part = order_fields.reduce((acc, f)=>Object.assign(acc, {[f]:row[f]}),{});
        let items = item_fields.reduce((acc, f)=>(row.hasOwnProperty(f) && row[f].length>0)?[...acc, [f, row[f]]]:acc, []);
        return Object.assign(order_first_part, {items:items.map(item=>zipObject(["itemname", "quantity"], item))})
      });
      let order = extract.reduce((acc, row)=>{
        let nb_trays = row.total_trays;
        if(nb_trays === 1){return acc.concat(row)}
        else {
          for (let index = 0; index < nb_trays; index++) {
            acc = acc.concat(Object.assign({},row, {"current_tray":index+1}))
          }
          return acc;
        }
      },[]);
      setOrders(order);
    }
      );
  }
  const generatePages = ()=>{
    let tagsByPage=10;
    orders.sort((a,b)=>a.tour>b.tour);
    return (
      range(Math.ceil(orders.length/tagsByPage)).map(pageNb=>(
        <TagSpoi key={pageNb}
        tags={orders.slice(pageNb*tagsByPage, (pageNb+1)*tagsByPage)}/>
      ))
    );
  }
  return (
    <Fragment>
    <Breadcrumb className="no-print">
      <Breadcrumb.Item href="/">{props.rootLabel}</Breadcrumb.Item>
      <Breadcrumb.Item active>{props.h1Title}</Breadcrumb.Item>
    </Breadcrumb>
    <Form className="no-print">
      <Form.Control type="file" 
        id="custom-file-input"
        label="Choisir fichier"
        onChange={handleChange}
      ></Form.Control>
    </Form>
    {generatePages()}
  </Fragment>
  )
}
export default About
