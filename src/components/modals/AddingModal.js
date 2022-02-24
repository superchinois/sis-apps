import React, { useState, useEffect } from 'react';

import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import Container from 'react-bootstrap/Container'
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col';
import table_helpers from '../../utils/bootstrap_table';
import common_helpers from '../../utils/common';

const AddingModal = (props) =>{
    // state of the modal
    let {handleChange, searchEndpoint, positionToInsert, locationData, show, handleClose, notifyLoading} = props;
    let [selectedItem, setSelectedItem] = useState(null);
    let [newLocation, setNewLocation] = useState("");
    let [loading, setLoading] = useState(false);
    useEffect(() => {
        let changeAddedData = async ()=>{
            if (loading) {
                notifyLoading(true);
                let location_fields = ["building","location"];
                let location = location_fields.reduce((a, f)=>Object.assign(a, {[f]:locationData[f]}),{detail_location:newLocation});
                let createdItem = common_helpers.buildItemFromMaster(selectedItem, location);
                createdItem["counted"]=-1;
                let response = await handleChange(createdItem, positionToInsert);
                if(response.status==201) {notifyLoading(false) ;handleClose();}
            }
        };
        changeAddedData();
      }, [loading]);

    // component
    return (<>
    <Modal size="lg" show={show} onHide={handleClose}>
            <Modal.Header>
                <Modal.Title>Adding Item</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Container fluid>
                    {/**Body of the modal with TypeaheadRemote*/}
                    <Row>
                        <Col>
                        {table_helpers.buildGroupDetails(["detail_loc", "Position", "text","", newLocation, false, 
                        e=>{let inputValue = e.target.value;setNewLocation(inputValue);}, _=>_.target.select()])}
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
                <Button variant="primary" onClick={()=>setLoading(true)}>Add Item
                </Button>
                <Button variant="secondary" onClick={handleClose}>Close</Button>
            </Modal.Footer>
        </Modal>
    </>);
};
export default AddingModal;