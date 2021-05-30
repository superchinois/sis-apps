import React, { Fragment, useState } from 'react';
import Breadcrumb from 'react-bootstrap/Breadcrumb';
import BordereauForm from '../components/BordereauForm';


const Bordereau = (props) => {
    return (
        <>
         <Breadcrumb className="no-print">
            <Breadcrumb.Item href="/">{props.rootLabel}</Breadcrumb.Item>
            <Breadcrumb.Item active>{props.h1Title}</Breadcrumb.Item>
        </Breadcrumb>
        <BordereauForm></BordereauForm>
        </>
    )
}

export default Bordereau