import React, { Fragment } from 'react'
import ArrivalForm from '../components/ArrivalForm'
import Breadcrumb from 'react-bootstrap/Breadcrumb'

const Arrival = (props) => (
  <Fragment>
    <Breadcrumb>
      <Breadcrumb.Item href="/">{props.rootLabel}</Breadcrumb.Item>
      <Breadcrumb.Item active>{props.h1Title}</Breadcrumb.Item>
    </Breadcrumb>
    <ArrivalForm></ArrivalForm>
  </Fragment>
)
export default Arrival
