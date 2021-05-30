import React, { useState} from 'react';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import Alert from 'react-bootstrap/Alert'

import BootstrapTable from 'react-bootstrap-table-next';
import ToolkitProvider from 'react-bootstrap-table2-toolkit';

import Container from 'react-bootstrap/Container'
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col';
import {range} from 'lodash';

import TagBordereau from './tags/TagBordereau';
import TypeaheadRemote from './TypeaheadRemote';
import ConfigApi from "../config.json";
import table_helpers from '../utils/bootstrap_table';

const falseFn = table_helpers.falseFn;
const dataFields = [
    ["id", "ID", true, falseFn],
    ["cardname", "DESTINATAIRE", false, falseFn],
    ["delivery_date", "DATE LIV", false, falseFn],
    ["nb_pal", "PAL / ROLL", false, falseFn],
    ["colis", "COLIS", true, falseFn],
    ["poids", "POIDS", false, falseFn],
    ["temp", "TEMP", true, falseFn],
    ["tournee", "TOURNEE", false, falseFn],
];
const dataLabels = ["dataField", "text", "hidden", "editable"];

const inverseDate = isoDate => isoDate.split("-").reverse().join("/")
const BASE_URL = ConfigApi.API_URL;
const SEARCH_URL = `${BASE_URL}/clients?search=`;

export default function BordereauForm(props) {
    const textPlaceholder = "Entrer un nom de client...";
    const columns = table_helpers.buildColumnData(dataFields, dataLabels, (cv, ks)=>{
        if(cv[0]=="delivery_date"){
            ks = ks.concat(["csvFormatter"]);
            cv = cv.concat([(cell, row, rowIndex) => `${inverseDate(cell)}`])
        }
        return [cv, ks];
    });
    const [destinataires, setDestinataires] = useState([]);
    const [selected, setSelected] = useState(null);
    const [state, setState] = useState({ selected: [] });
    const [isTagsDisplayed, setIsTagsDisplayed] = useState(false);
    const typeaheadRef = React.createRef();

    const resetStates = () => {
        setSelected(null);
        setIsTagsDisplayed(false);
    };
    const handleSelected = (selected) => {
        setSelected(selected[0]);
    }
    const businessPartnersSearchEndpoint = query => `${SEARCH_URL}${query}`;
    const labelKey = option => `${option.cardname}`;
    const renderMenuItem = (option, props) => (
        <div>
            <span style={{ whiteSpace: "initial" }}><div style={{ fontWeight: "bold" }}>{option.cardcode}</div> - {option.cardname}</span>
        </div>
    );

    const selectRow = {
        mode: 'checkbox',
        clickToSelect: false,
        clickToExpand: false,
        selected: state.selected,
        onSelect: table_helpers.buildHandleOnSelect(()=>state, setState),
        onSelectAll: table_helpers.buildHandleAllOnSelect(setState)
    };
    const handleSubmit = () =>{
        let current_id = destinataires.length == 0 ? 0 : destinataires.slice(-1)[0].id + 1;
        setDestinataires([...destinataires, { ...selected, id: current_id, colis:"", temp:""}]);
        typeaheadRef.current.clear();
        typeaheadRef.current.focus();
        setSelected(null);
        event.preventDefault();
    };
    const clearTypeahead = ()=>{
        setSelected(null);
        typeaheadRef.current.clear();
        typeaheadRef.current.focus();
    };
    const handleChange = (selected) => {
        return (event)=>{
            let inputId = event.target.id;
            let newValue = event.target.value;
            setSelected(Object.assign({}, selected, {[inputId]: newValue}));

        }
    }
    const handleDelete = () => {
        let remaining = destinataires.filter((item) => !state.selected.includes(item.id));
        setDestinataires(remaining);
        setState({ selected: [] });
    }
    const handleGenerateTags = () => {
        setIsTagsDisplayed(true);
    };
    const renderSupplierDetails = (selected) => {
        return (
            <Container fluid>
                <Row className="mt-2">
                    <Col>
                    <Form onSubmit={handleSubmit}>
                            <Form.Row>
                                <Col>
                                {table_helpers.buildGroupDetails(["cardname", "Destinataire", "text", "Cardname placeholder", selected.cardname, false, handleChange(selected), undefined, "-1"])}
                                </Col>
                                <Col>
                                {table_helpers.buildGroupDetails(["cardcode", "Cardcode", "text", "Cardcode placeholder", selected.cardcode, true, handleChange(selected), undefined, "-1"])}
                                </Col>
                            </Form.Row>
                            {table_helpers.buildGroupDetails(["delivery_date", "Date de Livraison","date", "DD/MM/YY",selected.delivery_date, false, handleChange(selected), undefined])}
                            {table_helpers.buildGroupDetails(["nb_pal", "Nb Pal / Roll","text", "Nb pal / roll",selected.nb_pal, false, handleChange(selected), undefined])}
                            {table_helpers.buildGroupDetails(["poids", "Poids","text", "Poids",selected.poids, false, handleChange(selected), ()=>{}])}
                            {table_helpers.buildGroupDetails(["tournee", "Tournee Liv","text", "tournee liv",selected.tournee, false, handleChange(selected), undefined])}

                            <Container>
                                <Row>
                                    <Col>
                                        <Button variant="primary" type="submit">
                                            Ajouter destinataire
                                        </Button>
                                    </Col>
                                    <Col>
                                        <Button variant="warning" onClick={clearTypeahead}>
                                            Effacer
                                        </Button>
                                    </Col>
                                </Row>
                            </Container>
                        </Form>
                    </Col>
                </Row>
            </Container>
        )
    }
    const generatePages = (destinataires)=>{
        let tagsByPage=2;
        let tags = destinataires.reduce((acc, row)=>{
            let nb_trays = row.nb_pal;
            if(nb_trays === 1){return acc.concat(row)}
            else {
              for (let index = 0; index < nb_trays; index++) {
                acc = acc.concat(Object.assign({},row, {"current_tray":index+1}))
              }
              return acc;
            }
          },[]);
        return (
          range(Math.ceil(tags.length/tagsByPage)).map(pageNb=>(
            <TagBordereau key={pageNb}
            destinataires={tags.slice(pageNb*tagsByPage, (pageNb+1)*tagsByPage)}/>
          ))
        );
      }
    const MyExportCSV = table_helpers.buildCsvExport;
    return (
        <>
            <div className="no-print">
                <TypeaheadRemote
                    forwardRef={typeaheadRef}
                    handleSelected={handleSelected}
                    selected={selected}
                    searchEndpoint={businessPartnersSearchEndpoint}
                    placeholder={textPlaceholder}
                    labelKey={labelKey}
                    renderMenuItem={renderMenuItem}
                />
                {selected ?
                    renderSupplierDetails(selected)
                    :
                    <Alert variant="info">Pas de client choisi</Alert>}
            </div>
            <div className="no-print">
                {destinataires.length > 0 ?
                (
                    <>
                    <Container fluid>
                        <Row>
                            <Col>
                                <Button variant="warning" onClick={handleDelete}>Delete</Button>
                            </Col>
                            <Col>
                                <Button variant="primary" onClick={handleGenerateTags}>Generer Affiches</Button>
                            </Col>
                        </Row>
                    </Container>
                        <ToolkitProvider
                            keyField="id"
                            data={destinataires}
                            columns={columns}
                            exportCSV={{
                                separator:';',
                                blobType:"text/csv;charset=utf-8",
                            }}
                        >
                            {
                                props => (
                                    <div style={{marginTop: "1em"}}>
                                        <MyExportCSV {...props.csvProps}></MyExportCSV>
                                        <hr />
                                        <BootstrapTable
                                            selectRow={selectRow}
                                            {...props.baseProps}
                                        />
                                    </div>
                                )
                            }
                        </ToolkitProvider>

                    </>
                ) : null}
            </div>
            <div>
                {isTagsDisplayed && destinataires.length > 0 ? 
                generatePages(destinataires)
                : null}
            </div>
        </>
    )
}