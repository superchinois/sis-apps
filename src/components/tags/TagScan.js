import React from 'react';
import {range} from 'lodash';
import './../../styles/TagScan.module.css';

export default function ScanTag(props) {
    const tag = props.tag;
    return (
        range(24).map(count => (
            <div styleName="subpagedemi" key={`${tag.itemcode}-${tag.id}-${count}`}>
                <div styleName="barcode">
                    <svg 
                    className="svgbarcode"
                    jsbarcode-format={`${tag.cbtype}`}
                    jsbarcode-value={`${tag.codebars}`}
                    jsbarcode-textmargin="0"
                    jsbarcode-height="30"
                    jsbarcode-width={tag.codebars.length>6?"1":"2"}/>
                    <div styleName="description">{tag.itemname}</div>
                </div>
            </div>
        ))
    );
}

/* {styles.subpagedemi} 
{styles.barcode}
{styles.description}
*/