import React from 'react';
import './../../styles/tagBordereau.css';

import { range } from "lodash";

export default function TagBordereau(props){
    const destinataires = props.destinataires;
    const nb_row_by_page=1;
    const nb_tags_by_row=2;
    let filtered_tags = destinataires.filter((_, index)=> index<nb_row_by_page*nb_tags_by_row);
    let rows_count = Math.ceil(filtered_tags.length/nb_tags_by_row);
    const inverseDate = isoDate => isoDate.split("-").reverse().join("/")
    const renderRow = (itemsRow, _index)=>{
        return (
            <div>
            {itemsRow.map((item, index) => (
                <div styleName={`tag`} key={`${item.cardcode}-${_index}-${index}`}>
                    <div styleName="cardname"
                    style={{fontSize:item.cardname.length<40?"34pt":"30pt"}}
                    >{`CLIENT: ${item.cardname}`}</div>
                    <div styleName="delivery-date">{`DATE DE LIVRAISON: ${inverseDate(item.delivery_date)}`}</div>
                    <div styleName="tag_footer">
                        <div styleName="tour">{`TOURNEE: ${item.tournee}`}</div>
                        <div styleName="pagination">{`PALETTE: ${item.current_tray}/${item.nb_pal}`}</div>
                    </div>
                </div>
            ))}
        </div>
        )
    }
    return (
        <>
        <div className="page">
            {range(rows_count).map((row, index)=>(
                <div key={`${index}`}>
                {renderRow(destinataires.slice(row*nb_tags_by_row, (row+1)*nb_tags_by_row), index)}
                </div>
            ))}
        </div>
        </>
    )
}