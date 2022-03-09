import React, { Fragment } from 'react'
import Breadcrumb from 'react-bootstrap/Breadcrumb'
import UnsoldForm from '../components/UnsoldForm'
import ConfigApi from '../config.json';

const Unsold = (props) => (
  <Fragment>
    <Breadcrumb>
      <Breadcrumb.Item href="/">{props.rootLabel}</Breadcrumb.Item>
      <Breadcrumb.Item active>{props.h1Title}</Breadcrumb.Item>
    </Breadcrumb>
    <UnsoldForm remote_url_fn={()=>`${ConfigApi.API_URL}/items/unsold`}></UnsoldForm>
  </Fragment>
)
export default Unsold