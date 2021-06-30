import React, { useState, useEffect } from 'react';

import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import Container from 'react-bootstrap/Container'
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col';
import table_helpers from '../../utils/bootstrap_table';
import react_helpers from '../../utils/react_helpers';
import {evaluate} from 'mathjs';
import { some } from 'lodash';

const commonDataReducer = (state, action)=>{
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

const UpdateModal = (props) => {
    let {item, handleChange, updated_by, show, handleClose, notifyLoading} = props;
    let [loading, setLoading] = useState(false);

    useEffect(() => {
        let updateItem = async ()=>{
            if (loading) {
                notifyLoading(true);
                let updatedData = {}; // Location or Count data
                let response = await handleChange(item.id, updatedData);
                if(response.status==200) {notifyLoading(false) ;handleClose();}
            }
        };
        updateItem();
    }, [loading]);
    const handleClick = () => {setLoading(true)};
    return ( <>
        <Modal size="lg" show={show} onHide={handleClose}>
            <Modal.Header>
                <Modal.Title>{item.itemcode}-{item.itemname}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Container fluid>

                </Container>
            </Modal.Body>
            <Modal.Footer>
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
      </>);

};
export default UpdateModal;