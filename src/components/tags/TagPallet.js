import React  from 'react';
import styles from './../../styles/tagPal.css';

export default function TagPallet(props){
    const tag=props.tag;
    return (
        <div styleName="tag">
            <div styleName="header">
                <div styleName="logo">
                    <h1>SIS</h1>
                </div>
                <div styleName="barcode">
                    <svg
                    className="svgbarcode"
                    jsbarcode-format={tag.cbtype}
                    jsbarcode-value={tag.codebars}
                    jsbarcode-textmargin="0"
                    jsbarcode-fontoptions="bold"
                    jsbarcode-height="40"
                    />
                </div>
                <div styleName="itemcode"><h1>{tag.itemcode}</h1></div>
            </div>
            {props.renderButton(<h1 styleName="designation" style={tag.description_size ? {fontSize:tag.description_size}:{}}>{tag.itemname}</h1>)}
            <div styleName="body">
                <div styleName="item">
                    <h2>EMPLACEMENT: <span styleName="location"> {tag.location}</span></h2>
                    <h2>PALETTE NUM. : {tag.pallet_id}</h2>
                    <h2>{tag.category}</h2>
                    <h3>{tag.supplier}</h3>
                    <div styleName="barcode center_content">
                        <svg
                        className="svgbarcode"
                        jsbarcode-format="code128"
                        jsbarcode-value={tag.pallet_id}
                        jsbarcode-textmargin="0"
                        jsbarcode-fontoptions="bold"
                        jsbarcode-height="40"
                        />
                    </div>
                </div>
                <div styleName="item">
                    <table>
                        <thead>
                            <tr>
                            <th styleName="thPal">LOT/UVC</th>
                            <th styleName="thPal">UVC/COLIS</th>
                            <th styleName="thPal">COLIS/PLAN</th>
                            <th styleName="thPal">PLAN/PALETTE</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>{tag.nb_lot_by_uvc}</td>
                                <td>{tag.nb_uvc_by_colis}</td>
                                <td>{tag.nb_colis_by_plan}</td>
                                <td>{tag.nb_plan}</td>
                            </tr>
                        </tbody>
                    </table>
                    <h1>NB DE COLIS/PALETTE: {tag.count}</h1>
                    <h1>RECEPTION: {tag.reception_date}</h1>
                    {tag.dluo ? <h1>DLUO: {tag.dluo}</h1>:null}
                </div>
            </div>
        </div>
    );
}