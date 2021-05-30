import React from 'react';
import './../../styles/tagSpoi.css';

import { range } from "lodash";
export default function TagSpoi(props) {
    /**
     * tag element is like
     * {
     * client_name:"CARREFOUR", 
     * tour: "T89",
     * total_trays:1,
     * current_tray:1,
     * items:[ {itemname:"Soja 300g", quantity:15},
     *         {itemname: "MAC 350g", quantity: 6}]
     * }
     */
    const tags = props.tags;
    const nb_row_by_page=5;
    const nb_tags_by_row=2;
    let filtered_tags = tags.filter((_, index)=> index<nb_row_by_page*nb_tags_by_row);
    let rows_count = Math.ceil(filtered_tags.length/nb_tags_by_row);
    function renderItems(items) {
        return (
            <div styleName="items-container">
                {items.map((item, index) => (
                    <div styleName="item" key={`${index}`}>
                        <div styleName="itemname">{item.itemname}</div>
                        <div styleName="quantity">{item.quantity}</div>
                    </div>
                ))}
            </div>
        );
    }
    function renderRow(itemsRow, _index) {
        return (
            <div>
                {itemsRow.map((item, index) => (
                    <div styleName={`tag`} key={`${item.client_name}-${_index}-${index}`}>
                        <div styleName="cardname"
                        style={{fontSize:item.client_name.length<40?"24pt":"20pt"}}
                        >{item.client_name}</div>
                        {renderItems(item.items)}
                        <div styleName="tag_footer">
                            <div styleName="tour">{item.tour}</div>
                            <div styleName="pagination">{item.current_tray}/{item.total_trays}</div>
                        </div>
                    </div>
                ))}
            </div>);
    }
    return (
        <>
        <div className="page">
            {range(rows_count).map((row, index)=>(
                <div key={`${index}`}>
                {renderRow(tags.slice(row*nb_tags_by_row, (row+1)*nb_tags_by_row), index)}
                </div>
            ))}
        </div>
        </>
    );
}