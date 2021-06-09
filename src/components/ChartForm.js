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
//import { v4 as uuidv4 } from 'uuid';
import Chart from "react-apexcharts";
import axios from 'axios';
import moment from 'moment';

//import io from 'socket.io-client';
//import { ToastContainer, toast } from 'react-toastify';
//import 'react-toastify/dist/ReactToastify.css';
import table_helpers from '../utils/bootstrap_table';
import react_helpers from "../utils/react_helpers";
import ConfigApi from "../config.json";

const BASE_URL = ConfigApi.API_URL;
const SEARCH_URL = `${BASE_URL}/items?search=`;



const myStyle = { padding: "10px 10px 10px 10px" };

const toIncVatPrice = (price, tva) => parseFloat(price * (1 + tva / 100)).toFixed(2);
const pricePackTtc = (price, saleFactor) => parseFloat(price * saleFactor).toFixed(2);
const isoStringDate = (date) => date.toISOString().split("T")[0];
const falseFn = table_helpers.falseFn;
const dataFields = [
  ["id", "ID", true, falseFn],
  ["itemcode", "Itemcode", false, falseFn],
  ["itemname", "Dscription", false, falseFn],
  ["quantity", "Quantité", false, table_helpers.trueFn]
];
const dataLabels = ["dataField", "text", "hidden", "editable"];

function getOriginDate(){
    // date in iso format yyyy-mm-dd
    let date = moment().subtract(20, 'weeks').format().split('T')[0];
    return date.slice(0,-2)+'01';
};
const initialData = {ma0:{data:[]}};
const chartDataReducer = (state, action)=>{
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

export default function ChartForm(props) {
  const [selected, setSelected] = useState(null);   // Item selected via typeahead component
  const [dataPoint, setDataPoint] = useState(null); // data point selected on column chart click
  const [products, setProducts] = useState([]);     // List of products added via the typeahead component
  const [state, setState] = useState({ selected: [] }); // List of items selected in the bootstrap table
  const [salesAtDate, setSalesAtDate] = useState([]);  
  const [discountsForItem, setDiscountsForItem] = useState([]);
  const [isLoading, setIsLoading] = useState(false); // Flag to represent a loading state
  const [sumOverPeriod, setSumOverPeriod] = useState(0); // 
  const columns = table_helpers.buildColumnData(dataFields, dataLabels);
  const defaultSorted = [{
    dataField: 'quantity',
    order: 'desc'
  }];

  const [dataChart, dispatch] = useReducer(chartDataReducer, initialData);
  const originDate = getOriginDate(); // Beginning date for various computations (discounts and sales)
  const clearTypeahead = ()=>{
    setSelected(null);
    setDataPoint(null);
    dispatch({type:'RESET_DATA'});
    setSalesAtDate([]);
    setDiscountsForItem([]);
    setIsLoading(false);
    setSumOverPeriod(0);
    typeaheadRef.current.clear();
    typeaheadRef.current.focus();
};
  /** effect for fetching sales at date on data selection event */
  useEffect(()=>{
      if(dataPoint!==null && dataPoint !== undefined){
          setIsLoading(true);
          fetchSalesAtDate(dataPoint);
      }
  }, [dataPoint]);

  /** effect for fetching discount dates for item on 
   * item selection via Typeahead component
   */
  useEffect(()=>{
    if(selected !==null && selected !==undefined){
        // can fetch discounts dates for given item
        let fromDate = originDate;
        let url = `${BASE_URL}/items/discounts/${selected.itemcode}?from-date=${fromDate}`
        axios({method:"get", url:url}).then(_=>{
            let discount_dates = _.data;
            setDiscountsForItem(discount_dates);
        });
    }
  }, [selected]);
  const buildDiscountPeriod = ({descriptionText, discount_start, discount_end})=>{
        let annotation = {
            x: discount_start,
            x2: discount_end,
            fillColor: "#B3F7CA",
            opacity: 0.4,
            label: {
            borderColor: "#B3F7CA",
            style: {
                fontSize: "10px",
                color: "#fff",
                background: "#00E396"
            },
            offsetY: -10,
            text: descriptionText
        }
    }
      return annotation;
  };
    const fetchSalesAtDate = (dataPointIndex) =>{
        let timestamp = dataChart["ma0"].data[dataPointIndex][0];
        let isoDate = isoStringDate(new Date(timestamp));
        let url = `${BASE_URL}/items/stats/sales/${selected.itemcode}/${isoDate}`
        axios({method:"get", url:url}).then(_=>{
            let sales = _.data;
            setSalesAtDate(sales);
            setIsLoading(false);
        });
    };
  const fetchChartData = (itemcode, mavg, isoDate) =>{
      let stat_url = (code, fromDate)=>`${BASE_URL}/items/stats/${code}?from-date=${fromDate}&moving-avg=${mavg}`;
      axios({method:"get", url:stat_url(itemcode, isoDate)})
      .then(response => {
          dispatch({type: 'ADD_DATA', id: `ma${mavg}`, data:response.data});
          setIsLoading(false);
      })
      .catch(error => console.error(error));
  };
    const buildChartOptions = (chartid, titleText, discounts)=>{
        let options_base={
            chart: {
              id: chartid,
              events: {
                    dataPointSelection: function(event, chartContext, config) {
                        let {dataPointIndex, seriesIndex} = config;
                        setDataPoint(dataPointIndex);
                    },
                    zoomed: function(chartContext, { xaxis, yaxis }){
                        let {min, max} = xaxis;
                        //console.log(chartContext.opts.chart.id);
                        //console.log(min, max);
                        let test_data = dataChart["ma0"].data;
                        let zoomed_data = test_data.filter(e=>{
                            if (e[0]>=min & e[0]<=max) return true;
                            return false;
                        });
                        setSumOverPeriod(zoomed_data.reduce((acc, el)=>el===null?acc:acc+el[1],0));
                    },
                },
                animations:{
                    enabled: false,
                },
            },
            dataLabels:{
                enabled: false,
            },
            title: {
              text: titleText,
            },
            xaxis: {
              type: 'datetime',
            },
            noData:{
                text: "Loading..."
            },
        };
        let chartOptions = options_base;
        if(discounts.length>0){
            let propNames=["descriptionText", "discount_start", "discount_end"];
            let annotations = discounts.map(({discount, fromdate, todate})=>{return buildDiscountPeriod(zipObject(propNames, [`${discount} %`, fromdate, todate]))});
            chartOptions = {...options_base, annotations:{xaxis:annotations}}
        }
        
        return chartOptions;
    };
    // Definitions for Typeahead component
    const typeaheadRef = React.createRef();
    const supplierSearchEndpoint = query => `${SEARCH_URL}${query}`;
    const itemSearchEndpoint = query => {
        let numberPattern = /^\d{6,}$/g;
        if(query.match(numberPattern)){
            return `${BASE_URL}/items/${query}`;
        }
        return `${SEARCH_URL}${query}`;
    };
    const labelKey = option => `${option.itemname}`;
    const renderMenuItem = (option, props) => (
        <div>
            <span style={{ whiteSpace: "initial" }}><div style={{ fontWeight: "bold" }}>{option.itemname}</div> - {option.onhand}</span>
        </div>
    )
    const handleSelected = (selected) => {
        let item = selected[0]
        try {
            if(item !==undefined){
                fetchChartData(item.itemcode,0, originDate);
                fetchChartData(item.itemcode,27, originDate);
                setIsLoading(true);
            }
        } catch (error) {
            console.error(error);
        }

        setSelected(item);
    }
    const textPlaceholder = "Entrer un nom d article ..."

    // Definition for handling Form submit and items deletion
    const handleSubmit = (event) => {
        let current_id = products.length == 0 ? 0 : products.slice(-1)[0].id + 1;
        setProducts([...products, { ...selected, id: current_id, quantity: 0 }]);
        setSelected(null);
        typeaheadRef.current.clear();
        typeaheadRef.current.focus();
        event.preventDefault();
    }
    const handleDeleteBtnClick = () => {
        let remaining = products.filter((item) => !state.selected.includes(item.id));
        setProducts(remaining);
        setState({ selected: [] });
    }

  const selectRow = {
    mode: 'checkbox',
    clickToSelect: false,
    clickToExpand: false,
    selected: state.selected,
    onSelect: table_helpers.buildHandleOnSelect(()=>state, setState),
    onSelectAll: table_helpers.buildHandleAllOnSelect(setState)
  };
  const cellEdit = cellEditFactory({
    mode: 'click',
    blurToSave: true,
  });

  // Definitions for rendering form field components
    const form_fields=["controlId", "label", "type", "placeholder", "value_fn", "readOnly", "tabIndex"];
    const renderFormField = (props) =>{
        const {controlId, label, type, placeholder, value_fn, ...others} = props;
            return (
                <>
                    <Form.Group controlId={controlId} as={Col}>
                    <Form.Label>{label}</Form.Label>
                        <Form.Control
                            type={type}
                            placeholder={placeholder}
                            value={value_fn(selected)}
                            {...others}
                        />
                    </Form.Group>
                </>
            );
    };
    const renderChartFields=["options", "series", "type", "width"];
    const renderChart = (props) => {
        const {options, series, type, width} = props;
        return (
            <div>
                <Chart
                options={options}
                series={series}
                type={type}
                width={width}/>
            </div>
        )
    };
  return (
    <div style={myStyle}>
      <TypeaheadRemote
                forwardRef={typeaheadRef}
                handleSelected={handleSelected}
                selected={selected}
                searchEndpoint={itemSearchEndpoint}
                placeholder={textPlaceholder}
                labelKey={labelKey}
                renderMenuItem={renderMenuItem}
            />
      {selected ?
        (
            <Container fluid>
                <Row className="mt-2">
                <Col>

          <Form onSubmit={handleSubmit}>
            <Form.Row>
                <Button variant="warning" onClick={clearTypeahead}>Clear</Button>
                {react_helpers.displayIf(()=>isLoading, Spinner)({animation:"border", role:"status"})}
            </Form.Row> 
            <Form.Row>
                {renderFormField(zipObject(form_fields,["itemcode","Itemcode","text","placeholder",_=> _.itemcode,true, "-1"]))}
                {renderFormField(zipObject(form_fields,["pu_ttc","Pu TTC","text","placeholder",_=>toIncVatPrice(_.vente, _.rate)+ "€",true, "-1"]))}
                {renderFormField(zipObject(form_fields,["pack_ttc","Pack TTC","text","placeholder",_=>pricePackTtc(toIncVatPrice(_.vente, _.rate), _.pcb_vente) + "€",true, "-1"]))}
            </Form.Row>
            <Form.Row>
                {renderFormField(zipObject(form_fields,["codebar","Codebar","text","placeholder",_=> _.codebars ? _.codebars : "N/A",true, "-1"]))}
                {renderFormField(zipObject(form_fields,["onhand","Stock Actuel","text","placeholder",_=> _.onhand,true, "-1"]))}
            </Form.Row>
            <Form.Row>
                <Col>
                    {dataChart["ma0"].data.length>0?
                    (
                     renderChart(zipObject(renderChartFields,[buildChartOptions("bar-sales", selected.itemname,discountsForItem)
                                                            ,[{'name':selected.itemname,'data':dataChart["ma0"].data}]
                                                            ,"bar", "1000"]))
                    )
                    :null}
                </Col>

                <Col>
                    <Row>Sum over period : {sumOverPeriod}</Row>
                    {react_helpers.displayIf(()=>isLoading && dataChart["ma0"].data.length>0, Spinner)({animation:"border", role:"status"})}
                    {(salesAtDate.length>0 && dataChart["ma0"].data.length>0)?
                    (   
                        <>
                        <span>{isoStringDate(new Date(dataChart["ma0"].data[dataPoint][0]))}</span>
                        <BootstrapTable bootstrap4 
                        keyField='cardname' 
                        data={ salesAtDate } 
                        columns={ [{dataField:"cardname", text:"Nom Client"}, {dataField: "quantity", text:"Quantite", sort:true}] }
                        defaultSorted={ defaultSorted }
                        pagination={ paginationFactory() } />
                        </>
                    )
                    :null}
                </Col>
            </Form.Row>
            <Form.Row>
              {"ma27" in dataChart && dataChart["ma27"].data.length>0?
              (
                renderChart(zipObject(renderChartFields,[buildChartOptions("lines-movingAvg", selected.itemname,discountsForItem)
                ,[{'name':selected.itemname,'data':dataChart["ma27"].data}]
                ,"line", "1000"]))
              )
              :null}
            </Form.Row>
            <Button variant="primary" type="submit">
              Submit
            </Button>
          </Form>
                </Col>
                </Row>
            </Container>

        ) : <Alert variant="info">No Item Selected yet !</Alert>}
      <div>
        {products.length > 0 ?
          (
            <>
              <Container fluid>
                <Row>
                  <Col>
                    <Button variant="warning" onClick={handleDeleteBtnClick}>Delete</Button>
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
    </div>
  );
}