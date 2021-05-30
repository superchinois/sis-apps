import React from 'react';
import './../../styles/tagPromo.css';

export default function TagPromo(props) {
    const tag = props.tag;
    return (
        <div styleName="subpagedemi">
            <div styleName="promo-banner center-content">
                <strong>{tag.headline}</strong>
                {
                tag.offer ?
                <div styleName="date-promo">{tag.offer}</div> :
                <div styleName="date-promo"> valable du {tag.start_promo} au  {tag.end_promo}</div>
                }
            </div>
            <div styleName="item-description">
                {props.renderButton(<h1 styleName="center-content designation" className="flex-item"
                    style={{fontSize: tag.description_size}}>{tag.itemname}</h1>)}
                <p styleName="center-content">Vendu {tag.vendu}</p>
            </div>
            <div styleName="item-price-promo">
                <h1 styleName="price-ht center-content ">{tag.pu_ht}  &#8364; <em>H.T.</em></h1>
                <p styleName="center-content">Prix {tag.unite_vente}</p>
                <h1 styleName="price-ttc center-content ">{tag.pu_ttc}  &#8364; <em>T.T.C.</em></h1>
            </div>
            <div styleName="item-summary">
                <ul>
                    {tag.pack_description !== 'x' ?
                    (<li>Soit {tag.ppack_ttc} &#8364; TTC le prix {tag.pack_description} {tag.pack_subdescription}</li>) :
                    null}
                    {tag.volumic_description !== 'x' ?
                    (<li>Soit {tag.volumic_price} &#8364; TTC le prix {tag.volumic_description}</li>) :
                    null}
                </ul>
            </div>
            <p styleName="itemcode" style={{fontSize:"12pt"}}>{tag.itemcode}</p>
        </div>
    )
}