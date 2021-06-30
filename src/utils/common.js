import React  from 'react';
import TypeaheadRemote from '../components/TypeaheadRemote';
import {zipObject} from 'lodash';

let common_helpers = {
    buildTypeAheadComponent : (itemsSearchEndpoint, handleSelected, selected)=>{
        return props =>{
            return (<TypeaheadRemote
                {...props}
                handleSelected={handleSelected}
                selected={selected}
                searchEndpoint={itemsSearchEndpoint}
                placeholder="Rechercher article ou code ..."
                labelKey={option => `${option.itemcode} - ${option.itemname}`}
                renderMenuItem={(option, props) => (
                    <div>
                        <span style={{whiteSpace:"initial"}}><div style={{fontWeight:"bold"}}>{option.itemcode}</div> - {option.itemname} - {option.onhand}</span>
                    </div>
                )}
                onKeyDown={e=>{
                    if (e.keyCode == 9) e.preventDefault();
                }
                }
            />);
        }
    },
    buildItemFromMaster : (masterItem, fromBaseItem)=>{
        let fields_toUpdate = ["itemcode", "itemname", "codebars", "onhand", "pcb_vente","pcb_achat","pcb_pal", "vente"];
        let fields =          ["itemcode", "itemname", "codebars", "onhand", "colisage_vente","colisage_achat","pcb_pal","pu_ht"];
        let createdItem = fromBaseItem;
        if(masterItem){
            let values = fields_toUpdate.map(_=>masterItem[_]);
            createdItem = Object.assign(zipObject(fields, values), createdItem);
        }
        return createdItem;
    }
}
export default common_helpers;