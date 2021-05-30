import React, { Fragment } from 'react'
import Breadcrumb from 'react-bootstrap/Breadcrumb'
import SimpleForm from '../components/SimpleForm'
import ConfigApi from "../config.json";

/**
 * 
 *   remote_url_fn: the remote url for getting computed data
 *   textPlaceholder: text placeholder for what text to enter to search
 *   search_url : URL to use to search for the query
 */
const HistoriqueClient = (props) => (
  <Fragment>
    <Breadcrumb>
      <Breadcrumb.Item href="/">{props.rootLabel}</Breadcrumb.Item>
      <Breadcrumb.Item active>{props.h1Title}</Breadcrumb.Item>
    </Breadcrumb>
    <SimpleForm search_url={`${ConfigApi.API_URL}/clients?search=`}
                textPlaceholder="Entrer un nom de client ..."
                remote_url_fn={cardcode=>`${ConfigApi.API_URL}/historique/${cardcode}`}></SimpleForm>
  </Fragment>
)
export default HistoriqueClient