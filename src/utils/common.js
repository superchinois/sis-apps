import React  from 'react';
import TypeaheadRemote from '../components/TypeaheadRemote';
import {zipObject} from 'lodash';
import axios from 'axios';

class DbDAO {
    constructor(base_url){
        this.base_url = base_url;
        this.item_id_url = (path) => `${base_url}/${path}`;
    }
    get remote_url() {
        return this.base_url;
    }
    getItem = (item_id) => axios({method:"get", url:this.item_id_url(item_id)});
    fetchItems = (params) => axios({method:"get", url:this.remote_url, params:params});
    createItemInDb = (createdItem) =>{
        return axios({method:"post", url:`${this.remote_url}`, data:createdItem});
    };
    updateItemInDB = (item_id, updatedValues)=>{
        let item_url=this.item_id_url(item_id);
        return axios({method:"put", url: item_url, data:updatedValues});
    };
    deleteItemInDb = (item_id) => {
        return axios({method:"delete", url:this.item_id_url(item_id)});
    };

}

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
    },
    buildDao : (base_url) => new DbDAO(base_url)
}
export default common_helpers;