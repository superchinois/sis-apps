import React, { Fragment } from 'react'
import Breadcrumb from 'react-bootstrap/Breadcrumb'
import DluoLotForm from '../components/DluoLotForm'

const DluoLot = (props) => (
  <Fragment>
    <Breadcrumb>
      <Breadcrumb.Item href="/">{props.rootLabel}</Breadcrumb.Item>
      <Breadcrumb.Item active>{props.h1Title}</Breadcrumb.Item>
    </Breadcrumb>
    <DluoLotForm></DluoLotForm>
  </Fragment>
)
export default DluoLot