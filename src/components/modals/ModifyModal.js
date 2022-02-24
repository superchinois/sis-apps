import React, { useState, useEffect } from 'react';

import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import Container from 'react-bootstrap/Container'
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col';
import table_helpers from '../../utils/bootstrap_table';
import common_helpers from '../../utils/common';

const ModifyModal = (props)=>{
    // state of the modal
    let {item, handleChange, searchEndpoint, show, handleClose} = props;
    let [newLocation, setNewLocation] = useState(item.detail_location);
    let [selectedItem, setSelectedItem] = useState(null);
    const handleFocus = (event)=>{event.target.select()};
    // component
    return (<>
        <Modal size="lg" show={show} onHide={handleClose}>
            <Modal.Header>
                <Modal.Title>{item.itemname}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Container fluid>
                    {/**Body of the modal with TypeaheadRemote*/}
                    <Row>
                        <Col>
                        {table_helpers.buildGroupDetails(["detail_loc", "Position", "number","", newLocation, false, 
                        e=>{let inputValue = e.target.value;setNewLocation(inputValue);}, handleFocus])}
                        </Col>
                    </Row>
                    <Row>
                    <Col>
                    {common_helpers.buildTypeAheadComponent(searchEndpoint,_=>setSelectedItem(_[0]), selectedItem)()}
                    </Col>
                    </Row>
                </Container>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="primary" onClick={()=>{
                    let updated_fields = common_helpers.buildItemFromMaster(selectedItem, {detail_location: newLocation});
                    if("itemcode" in updated_fields) {
                        updated_fields = {...updated_fields, counted:-1, detail_counted:"0"}
                    }
                    handleChange(item.id, updated_fields)
                    handleClose();
                    }}>Save Changes
                </Button>
                <Button variant="secondary" onClick={handleClose}>Close</Button>
            </Modal.Footer>
        </Modal>
    </>);
};
export default ModifyModal;
