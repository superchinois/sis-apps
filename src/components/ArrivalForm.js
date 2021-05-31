import React, { useEffect, useState } from 'react';
import Button from 'react-bootstrap/Button';
import Spinner from 'react-bootstrap/Spinner'
import Alert from 'react-bootstrap/Alert';
import BootstrapTable from 'react-bootstrap-table-next';
import filterFactory, { textFilter } from 'react-bootstrap-table2-filter';
import axios from 'axios';
import table_helpers from '../utils/bootstrap_table';
import react_helpers from "../utils/react_helpers";
import ConfigApi from '../config.json';
const BASE_URL = ConfigApi.SERVICES_API_URL;
const dataFields = [
    ["id", "ID", true, false],
    ["itemcode", "Itemcode", false, false],
    ["dscription", "Dscription", false, true],
    ["ETA", "ETA", false, true],
    ["TC", "TC", false, false],
    ["DOSSIER", "Dossier", false, true]
];
const dataLabels = ["dataField", "text", "hidden", "sort"];
let filters = { "dscription": "", "itemcode": "" };

export default function ArrivalForm(props) {
    const columns = table_helpers.buildColumnData(dataFields, dataLabels, (cv, ks)=>{
        if (cv[0] == "dscription" || cv[0] == "itemcode") {
            cv = cv.concat(textFilter({
                getFilter: (filter) => { filters[cv[0]] = filter; }
            }));
            ks = ks.concat("filter")
        }
        return [cv,ks];
    });
    const [loading, setLoading] = useState(false);
    const [products, setProducts] = useState([]);
    const [alertMessage, setAlertMessage] = useState(null);
    useEffect(() => {
        setLoading(true);
        axios({ method: "get", url: `${BASE_URL}/arrival/next` })
            .then(products => {
                setProducts(products.data.map((p, idx) => Object.assign({}, { id: idx }, p))); setLoading(false);
            })
            .catch(error =>{
                setLoading(false);
                setAlertMessage(error.message);
            });
    }, []);
    const handleClearClick = () => { Object.values(filters).forEach(filter => filter('')) };
    return (
        <>
            <Button variant="primary" onClick={handleClearClick}>Clear all filters</Button>
            {react_helpers.displayIf(()=>loading, Spinner)({animation:"border", role:"status"})}
            <BootstrapTable
                keyField='id'
                data={products}
                columns={columns}
                filter={filterFactory()} />
             {react_helpers.displayIf(()=>alertMessage, Alert)({variant:"danger", dismissible:true, children:alertMessage})}
        </>
    )
}