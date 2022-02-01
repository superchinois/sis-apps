import React, { useState, useEffect, useReducer } from 'react';

import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import Container from 'react-bootstrap/Container'
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col';
import CreatableSelect from 'react-select/creatable';
import axios from 'axios';

import react_helpers from '../../utils/react_helpers';
import table_helpers from '../../utils/bootstrap_table';
import {evaluate} from 'mathjs';
import ConfigApi from "../../config.json";
import common_helpers from '../../utils/common';

const BASE_URL = ConfigApi.INVENTORY_URL;

const initialData = (item) => {return {buildings: [], building:item.building||""
                    , locations:[], location:item.location||""
                    , detail_location:item.detail_location||""
                    , detail_counted:item.detail_counted||"0", boxcount: item.counted==-1?0:(item.counted-evaluate(item.detail_counted||0))/item.colisage_achat||0
                    , counted: item.counted||"0"
                    , counted_by:""
                    , itemname: item.itemname||""}};

const commonDataReducer = react_helpers.dataReducer(initialData);

const ConfirmDeleteModal = (props) => {
    let {item, show, handleClose, notifyCloseParent, itemDao, setRefresh} = props;
    const deleteItemFromDb = () =>{
        itemDao.deleteItemInDb(item.id)
        .then(response => {
            itemDao.fetchItems({itemcode:item.itemcode})
            .then(response => {
                setRefresh(true);
                handleClose();
                notifyCloseParent();
            })
        });
    };
    return ( <>
        <Modal show={show} onHide={handleClose}>
            <Modal.Header>
                <Modal.Title>Voulez vous vraiment supprimer l'article {item.itemname} ?</Modal.Title>
            </Modal.Header>

            <Modal.Footer>
                <Button
                variant="danger"
                className="mr-auto"
                onClick={deleteItemFromDb}
                >Supprimer
                </Button>
                <Button variant="secondary" onClick={handleClose}>Annuler</Button>
            </Modal.Footer>
        </Modal>
      </>);
};

const UpdateModal = (props) => {
    let {item, handleChange, itemDao, setRefresh, show, handleClose, notifyLoading} = props;
    const [loading, setLoading] = useState(false);
    const [commonData, dispatchData] = useReducer(commonDataReducer, initialData(item));
    const [showDelete, setShowDelete] = useState(false);
    useEffect(() => {
        let updateItem = async ()=>{
            if (loading) {
                notifyLoading(true);
                let fields=["building", "location", "detail_location", "counted", "detail_counted", "itemname"];
                let toUpdate = fields.filter(f=>item[f]!==commonData[f]);
                let updatedData = toUpdate.reduce((acc, field)=>Object.assign(acc, {[field]:commonData[field]}), {});
                let response = await handleChange(item.id, updatedData);
                if(response.status==200) {notifyLoading(false);handleClose();}
            }
        };
        updateItem();
        return () => setLoading(false);
    }, [loading]);
    useEffect(()=>{
        let building_url=`${BASE_URL}/api/buildings`;
        axios({ method: "get", url: building_url })
            .then(items => {
                let result = items.data.map(_=>{return {value: _, label:_};});
                updateCommonData("buildings", result);
            });
    },[]);
    const fetchLocationsByBuilding = (building) =>{
        let alleys_url=`${BASE_URL}/api/alleys_levels`;
        let params = {building:building};
        axios({method:"get", url: alleys_url, params:params})
        .then(response =>{
            let result = response.data.map(_=>{return {value: _, label:_};});
            updateCommonData("locations", result);
        });
    };
    const handleClick = () => {
        setLoading(true);
    };
    const updateCommonData = (id, data) => dispatchData({type:'ADD_DATA', id:id, data:data});
    const onChangeBuilding = (newValue, actionMeta) => {
        let selectedBuilding = newValue.value;
        updateCommonData("building", selectedBuilding);
        fetchLocationsByBuilding(selectedBuilding);
    };
    const onChangeLocation = (newValue, actionMeta) => {
        let selectedLocation = newValue.value;
        updateCommonData("location", selectedLocation);
    };
    const handleFocus = (event)=>{event.target.select()};
    const updateCounted = (boxCounted)=>{
        updateCommonData("boxcount", boxCounted);
        updateCommonData("counted", boxCounted*item.colisage_achat+evaluate(commonData.detail_counted))
    };
    return ( <>
        <Modal size="lg" show={show} onHide={handleClose}>
            <Modal.Header>
                <Modal.Title>{item.itemcode}-{item.itemname}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Container fluid>
                <Row>
                    <Col>
                    {table_helpers.buildGroupDetails(["itemname","Description","text", "Entrer nom", commonData.itemname, false, 
                    e=>updateCommonData("itemname", e.target.value.toUpperCase())])}
                    </Col>
                </Row>
                <Row>
                    <Col>
                    <CreatableSelect
                        name="building"
                        options={commonData.buildings||""}
                        defaultValue={{label:item.building, value:item.building}}
                        className="basic-select"
                        classNamePrefix="select"
                        onChange={onChangeBuilding}
                        placeholder={"Choisir batiment ..."}
                    />
                    </Col>
                    <Col>
                    <CreatableSelect
                        defaultValue={{label:item.location, value:item.location}}
                        defaultOptions
                        cacheOptions
                        options={commonData.locations||""}
                        onChange={onChangeLocation}
                        isSearchable
                    />
                    </Col>
                </Row>
                <Row>
                    <Col>
                    {table_helpers.buildGroupDetails(["detail_location","Place","text", "Entrer place", commonData.detail_location, false, 
                    e=>updateCommonData("detail_location", e.target.value)])}
                    </Col>
                </Row>
                <Row>
                    <Col>
                        {table_helpers.buildGroupDetails(["test-2","Eval", "text", "Eval Comptage", commonData.counted, true, undefined, undefined,"-1"])}
                    </Col>
                    </Row>
                <Row>
                <Col>
                    {table_helpers.buildGroupDetails(["nbcolis", "CT compté", "number", "Entrer nb ct",
                    commonData.boxcount, false, e=>{updateCounted(e.target.value)},handleFocus,"0"])}
                    </Col>
                    <Col>
                    {table_helpers.buildGroupDetails(["uvByColis", "UN/CT", "text","", item.colisage_achat, true,null,null,"-1"])}
                    </Col>
                    <Col>
                        {table_helpers.buildGroupDetails(["test-1","UV. compté", "text", "Entrer comptage", 
                        commonData.detail_counted, false, 
                        common_helpers.updateCountingData(_=>updateCommonData("detail_counted", _),
                        _=>updateCommonData("counted", commonData.boxcount*item.colisage_achat+_))
                        , handleFocus, "0"])}
                    </Col>
                </Row>
                </Container>
            </Modal.Body>
            <Modal.Footer>
                <Button
                variant="danger"
                className="mr-auto"
                onClick={()=>setShowDelete(true)}
                >Delete
                </Button>
                <Button
                variant="primary"
                disabled={loading}
                onClick={!loading ? handleClick : null}
                >
                {loading ? 'Loading…' : 'Click to save'}
                </Button>
                <Button variant="secondary" onClick={handleClose}>Close</Button>
            </Modal.Footer>
        </Modal>
        {react_helpers.displayIf(()=>showDelete, ConfirmDeleteModal)({item:item, 
        show:showDelete,handleClose:()=>setShowDelete(false), notifyCloseParent:handleClose
        , itemDao:itemDao, setRefresh: setRefresh})}
      </>);

};
export default UpdateModal;