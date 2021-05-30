import React, { Fragment, useState } from 'react';
import Breadcrumb from 'react-bootstrap/Breadcrumb';
import CadencierForm from '../components/CadencierForm';
import ConfigApi from "../config.json";

const Cadencier = (props) => {
    return (
        <>
         <Breadcrumb className="no-print">
            <Breadcrumb.Item href="/">{props.rootLabel}</Breadcrumb.Item>
            <Breadcrumb.Item active>{props.h1Title}</Breadcrumb.Item>
        </Breadcrumb>
        <CadencierForm remote_url_fn={cardcode=>`${ConfigApi.API_URL}/suppliers/${cardcode}/sales/weekly`}></CadencierForm>
        </>
    )
}

export default Cadencier