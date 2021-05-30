import React, {useState} from 'react';
import Navbar from 'react-bootstrap/Navbar';
import Nav from 'react-bootstrap/Nav';
//import Form from 'react-bootstrap/Form';

//import Button from 'react-bootstrap/Button';
export default function MyNavBar(props) {
    return (
    <Navbar bg="light" expand="lg" sticky="top">
        <Navbar.Brand href="/">Home</Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
        <Nav className="mr-auto">
            <Nav.Link href="/sample">Tags</Nav.Link>
            <Nav.Link href="/about">About</Nav.Link>
            <Nav.Link href="/arrival">Arrival</Nav.Link>
            <Nav.Link href="/order">Order</Nav.Link>
        </Nav>
            {/* <Form inline>
                <Form.Control type="text" placeholder="Search" className="mr-sm-2" />
                <Button variant="outline-success">Search</Button>
            </Form> */}
        </Navbar.Collapse>
    </Navbar>
    );
}