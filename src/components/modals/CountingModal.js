import React, { useState, useEffect } from 'react';

import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import Container from 'react-bootstrap/Container'
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col';
import table_helpers from '../../utils/bootstrap_table';
import react_helpers from '../../utils/react_helpers';
import common_helpers from '../../utils/common';
import {evaluate} from 'mathjs';

const CountingModal =(props) =>{
    let {item, handleChange, counted_by, show, handleClose, notifyLoading} = props;
    let [detailCounted, setDetailCounted] = useState(item.detail_counted||"0");
    let [counted, setCounted] = useState(item.counted||"0");
    let [boxcount, setBoxcount] = useState(item.counted==-1?0:(item.counted-evaluate(item.detail_counted||0))/item.colisage_achat||0);
    let [loading, setLoading] = useState(false);
    const handleFocus = (event)=>{event.target.select()};
    const updateCounted = (boxCounted)=>{
        setBoxcount(boxCounted);
        setCounted(boxCounted*item.colisage_achat+evaluate(detailCounted));
    };
    useEffect(() => {
        let changeCountedData = async ()=>{
            if (loading) {
                notifyLoading(true);
                let countedData = {counted: counted, detail_counted: detailCounted, counted_by:counted_by}
                let response = await handleChange(item.id, countedData);
                if(response.status==200) {notifyLoading(false) ;handleClose();}
            }
        };
        changeCountedData();
      }, [loading]);
    
    const handleClick = () => {setLoading(true)};
    return ( <>
        <Modal size="lg" show={show} onHide={handleClose}>
            <Modal.Header>
                <Modal.Title>{item.itemcode}-{item.itemname}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Container fluid>
                    <Row>
                    <Col>
                        {table_helpers.buildGroupDetails(["puht","Prix Unit. HT", "text", "", parseFloat(item.pu_ht).toFixed(2), true, undefined, undefined,"-1"])}
                        </Col>
                        <Col>
                        {table_helpers.buildGroupDetails(["test-5","Codebarre", "text", "", item.codebars, true, undefined, undefined,"-1"])}
                        </Col>
                    </Row>
                    <Row>
                        <Col>
                        {table_helpers.buildGroupDetails(["test-6","Stock SAP", "text", "", item.onhand, true, undefined, undefined,"-1"])}
                        </Col>
                        <Col>
                        {table_helpers.buildGroupDetails(["test-7","Stock en Colis","text", "", 
                        (parseFloat(item.onhand) / parseFloat(item.colisage_achat)).toFixed(2), true, undefined, undefined, "-1"])}
                        </Col>
                        {react_helpers.displayIf(_=>item.pcb_pal>1, Col)({
                            children: (
                                table_helpers.buildGroupDetails(["onhandpallet", "Stock en palette", "text", ""
                                , (parseFloat(item.onhand) / parseFloat(item.colisage_achat) / parseFloat(item.pcb_pal)).toFixed(2), true, undefined, undefined, "-1"])
                            )
                        })}
                    </Row>
                    <Row>
                        <Col>
                        {table_helpers.buildGroupDetails(["test-4","Colisage Vente", "text", "", item.colisage_vente, true, undefined, undefined,"-1"])}
                        </Col>
                        <Col>
                        {table_helpers.buildGroupDetails(["test-3","Colisage Achat", "text", "", item.colisage_achat, true, undefined, undefined,"-1"])}
                        </Col>
                        {react_helpers.displayIf(_=>item.pcb_pal>1, Col)(
                            {children:table_helpers.buildGroupDetails(["test-8","Colisage Pal", "text", "", item.pcb_pal, true, undefined, undefined,"-1"])}
                        )}
                    </Row>
                    <Row>
                        <Col>
                            {table_helpers.buildGroupDetails(["test-2","Eval", "text", "Eval Comptage", counted, true, undefined, undefined,"-1"])}
                        </Col>
                    </Row>
                    <Row>
                        <Col>
                        {table_helpers.buildGroupDetails(["nbcolis", "CT compté", "number", "Entrer nb ct", boxcount, false, e=>{updateCounted(e.target.value)},handleFocus,"0"])}
                        </Col>
                        <Col>
                        {table_helpers.buildGroupDetails(["uvByColis", "UN/CT", "text","", item.colisage_achat, true,null,null,"-1"])}
                        </Col>
                        <Col>
                            {table_helpers.buildGroupDetails(["test-1","UV. compté", "text", "Entrer comptage", 
                            detailCounted, false, 
                            common_helpers.updateCountingData(setDetailCounted, _=>setCounted(boxcount*item.colisage_achat+_))
                            , handleFocus, "0"])}
                        </Col>
                  </Row>
              </Container>
            </Modal.Body>
            <Modal.Footer>
                <Button
                variant="primary"
                disabled={loading}
                onClick={!loading ? handleClick : null}
                >
                {loading ? 'Loading…' : 'Click to save'}
                </Button>
                <Button variant="secondary" onClick={handleClose}>Close</Button>
            </Modal.Footer>
        </Modal>
      </>);
    
};
export default CountingModal;