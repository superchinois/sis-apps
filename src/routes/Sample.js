import React, { useState, useEffect } from 'react'
import csvHelpers from './../utils/processCsv';
import Form from 'react-bootstrap/Form'
import bsCustomFileInput from 'bs-custom-file-input'
import { range } from "lodash";
import Alert from 'react-bootstrap/Alert'

import JsBarcode from 'jsbarcode';
import WithModal from '../components/WithModal';
import MyModal from '../components/MyModal';
import TagScan from '../components/tags/TagScan';
import TagPromo from '../components/tags/TagPromo';
import TagPallet from '../components/tags/TagPallet';
import TagRack from '../components/tags/TagRack';
import Breadcrumb from 'react-bootstrap/Breadcrumb'


const Sample = (props) => {
  const [tags, setTags] = useState([]);
  const [tagType, setTagType] = useState("RACK");

  function WithTagsNull(Component, countByPages) {
    return function (props) {
      const WithModalComponent = WithModal(Component, MyModal);
      return (tags.length > 0) ?
        (
          range(Math.ceil(tags.length / countByPages)).map((pageNb => (
            <div key={`${pageNb}`} className={props.pageOrient}>
              {tags.slice(countByPages * pageNb, countByPages * (pageNb + 1)).map((tag, index) => <WithModalComponent key={`${pageNb}-${tag.itemcode}-${index}`} tag={tag} />)}
            </div>
          )))
        ) : <Alert variant="info">No Data Loaded yet !</Alert>
    }
  }
  const RackTag = WithTagsNull(TagRack, 6);
  const ScanTag = WithTagsNull(TagScan, 1);
  const PromoTag = WithTagsNull(TagPromo, 2);
  const PalletTag = WithTagsNull(TagPallet, 1);

  const SelectTag = (tagType, tags) => {
    switch (tagType) {
      case "RACK":
        return <RackTag tags={tags} pageOrient="page" />;
      case "SCAN":
        return <ScanTag tags={tags} pageOrient="page" />
      case "PROMO":
        return <PromoTag tags={tags} pageOrient="page-landscape" />;
      case "PALETTE":
        return <PalletTag tags={tags} pageOrient="page-landscape" />;
      default:
        return null;
    }
  }

  const handleSelectChange = event => { setTagType(event.target.value) }
  const handleChange = (event) => {
    let filePath = event.target.files[0];
    csvHelpers.loadCsv({
      tagType: tagType,
      startDate: "2021-06-04",
      endDate: "2021-06-25",
      filePath: filePath,
    }).then((data) => {
      console.log(data);
      let flattenedData = data.reduce((flat, element) => [...flat, ...element], [])
        .map((e, idx) => Object.assign({}, e, { id: idx, headline: "PROMO", offer:""})); //"1 ACHETÉ=1 OFFERT", side:"", offer:""
      setTags(flattenedData);
    });
  }
  useEffect(() => {
    bsCustomFileInput.init();
    if (tags.length > 0) {
      JsBarcode(".svgbarcode").init();
    }
  }, [tags]);
  return (
    <>
      <Breadcrumb className="no-print">
        <Breadcrumb.Item href="/">{props.rootLabel}</Breadcrumb.Item>
        <Breadcrumb.Item active>{props.h1Title}</Breadcrumb.Item>
      </Breadcrumb>
      <Form className="no-print">
        <Form.Group controlId="tag-type">
          <Form.Label>Select Tag Type</Form.Label>
          <Form.Control as="select" onChange={handleSelectChange}>
            <option>RACK</option>
            <option>PROMO</option>
            <option>SCAN</option>
            <option>PALETTE</option>
          </Form.Control>
        </Form.Group>
        <Form.Group controlId="formFile" className="mb-3">
          <Form.Label>Choisir Fichier ...</Form.Label>
          <Form.Control type="file" onChange={handleChange}/>
        </Form.Group>
      </Form>
      {SelectTag(tagType, tags)}
    </>
  )
}

export default Sample
