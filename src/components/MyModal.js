import React, { useRef } from 'react';
import Modal from 'react-bootstrap/Modal';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import {evaluate} from 'mathjs';

export default function MyModal({show, handleClose, tag, handleTagChange}){
    const textInput = useRef(null);
    const runMathjsEval = (event) => {
        let expression = event.target.value;
        let result = evaluate(expression);
        textInput.current.value = result ? result: "Enter expression";
    }

    return (<Modal show={show} onHide={handleClose}>
        <Modal.Header closeButton>
            <Modal.Title>Modify item</Modal.Title>
        </Modal.Header>
        <Modal.Body>
            <Form>
                <Form.Group controlId="itemname">
                    <Form.Label>Item Name</Form.Label>
                    <Form.Control type="text" 
                    placeholder="Enter itemname"
                    value={tag.itemname}
                    onChange={(event) =>{
                        let updatedTag = Object.assign({}, tag, {[event.target.id]:event.target.value});
                        handleTagChange({...event, tag:updatedTag});
                    }}
                    />
                </Form.Group>
                {tag.pu_ht &&
                    <Form.Group controlId="pu_ht">
                    <Form.Label>Prix unitaire ht</Form.Label>
                    <Form.Control type="number" 
                    placeholder="Enter price"
                    value={tag.pu_ht}
                    onChange={(event) =>{
                        let updatedTag = Object.assign({}, tag, {[event.target.id]:event.target.value});
                        handleTagChange({...event, tag:updatedTag});
                    }}
                    onBlur={(event) => {
                        let formatted = parseFloat(event.target.value).toFixed(2);
                        let updatedTag = Object.assign({}, tag, {[event.target.id]: formatted});
                        handleTagChange({target:{id:event.target.id, value:formatted}, tag:updatedTag});
                    }}
                    />
                </Form.Group>}
                {tag.description_size && 
                (<Form.Group controlId="description_size">
                <Form.Label>Taille Police Description</Form.Label>
                <Form.Control type="number" 
                placeholder="Enter size in pt"
                value={Number(tag.description_size.split("pt")[0])}
                onChange={(event) =>{
                    let updatedTag = Object.assign({}, tag, {[event.target.id]:`${event.target.value}pt`});
                    handleTagChange({...event, tag:updatedTag});
                }}
                />
            </Form.Group>)
                }
                
                <Form.Group controlId="mathExpression">
                    <Form.Label>Test Mathjs eval</Form.Label>
                    <Form.Control type="text" 
                    placeholder="Enter expression"
                    ref={textInput}
                    onBlur={runMathjsEval}
                    />
                </Form.Group>
            </Form>
        </Modal.Body>
        <Modal.Footer>
            <Button variant="secondary" onClick={handleClose}>
                Close
        </Button>
            <Button variant="primary" onClick={handleClose}>
                Save Changes
        </Button>
        </Modal.Footer>
    </Modal>);
}