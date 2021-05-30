import React, {useState} from 'react';
import "./../../styles/TagComponent.css";

const packStyle = {fontSize:"smaller",fontWeight: "normal"};
export default function RackTag(props){
    const tag = props.tag;

    function despcriptionPrice(tag){
         if(tag.pack_description !== 'x') {
            return (<tr>
            <td styleName="price-label"></td>
            <td styleName="ppack-ht" style={packStyle}>Prix {tag.pack_description} {tag.pack_subdescription}</td>
            <td styleName="tax-type"></td>
            <td styleName="ppack-ttc">{tag.ppack_ttc}&#8364;</td>
            <td styleName="tax-type">TTC</td>
            </tr>);
        }
        return null;
    }

    function volumicPrice(tag){
        if(tag.volumic_description !== 'x') {
            return (<tr>
                <td styleName="price-label"></td>
                <td styleName="ppack-ht" style={packStyle}>Prix {tag.volumic_description}</td>
                <td styleName="tax-type"></td>
                <td styleName="ppack-ttc">{tag.volumic_price}&#8364;</td>
                <td styleName="tax-type">TTC</td>
            </tr>);
        }
        return null;
    }
    return (
        <div styleName={`tag${tag.side}`}>
            <div styleName="item-description">
            {props.renderButton(<h1 styleName="designation" style={{fontSize:tag.description_size}}>{tag.itemname}</h1>)}
            <p> Vendu {tag.vendu}</p>
            </div>
            <table styleName="table-price">
                <tbody>
                    <tr>
                        <td styleName="price-label">Prix {tag.unite_vente}</td>
                        <td styleName="pu-ht">{tag.pu_ht}&#8364;</td>
                        <td styleName="tax-type">HT</td>
                        <td styleName="pu-ttc">{tag.pu_ttc}&#8364;</td>
                        <td styleName="tax-type">TTC</td>
                    </tr>
                    {despcriptionPrice(tag)}
                    {volumicPrice(tag)}
                </tbody>
            </table>
            <div styleName={`barcode-${tag.cbcss}`}>
                <svg
                    className="svgbarcode"
                    jsbarcode-format={`${tag.cbtype}`}
                    jsbarcode-value={`${tag.barcode}`}
                    jsbarcode-textmargin="0"
                    jsbarcode-height="30"
                    jsbarcode-width="1"
                />
            </div>
            <div styleName="itemcode">
                {tag.itemcode}
            </div>
        </div>
        );
};