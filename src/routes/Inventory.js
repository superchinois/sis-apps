import React, { Fragment } from 'react'
import Breadcrumb from 'react-bootstrap/Breadcrumb'
import InventoryForm from '../components/InventoryForm'
import ConfigApi from "../config.json";

/**
 * 
 *   remote_url_fn: the remote url for getting computed data
 *   textPlaceholder: text placeholder for what text to enter to search
 *   search_url : URL to use to search for the query
 */
const Inventory = (props) => (
  <Fragment>
    <Breadcrumb>
      <Breadcrumb.Item href="/">{props.rootLabel}</Breadcrumb.Item>
      <Breadcrumb.Item active>{props.h1Title}</Breadcrumb.Item>
    </Breadcrumb>
    <InventoryForm></InventoryForm>
  </Fragment>
)
export default Inventory