import React  from 'react';
import TypeaheadRemote from '../components/TypeaheadRemote';
import {zipObject} from 'lodash';
import axios from 'axios';
import {evaluate} from 'mathjs';
import {some} from 'lodash';
import {prop, compose, __,  gt} from 'ramda';

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

const isGtZero = (property) => compose(gt(__, 0), prop(property));
const existsAndPredicate = (predicate) => (key) => (row) => {
    let value = prop(key)(row); 
    return  value!=undefined && predicate(value);
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
    buildDao : (base_url) => new DbDAO(base_url),
    updateCountingData : (setDetailCounted, setCountedUsing)=>{
        return e=>{
            let inputValue = e.target.value;
            setDetailCounted(inputValue)
            let endOperator = some(["+","-", "/", "*"].map(_=> inputValue.endsWith(_)), Boolean);
            let evaluated = 0;
            if (endOperator){
                evaluated = evaluate(inputValue.substring(0,inputValue.length-1));
            }
            else {
                evaluated = evaluate(inputValue);
            }
            setCountedUsing(evaluated);
        }
    },
    buildItemSearchEndpoint: (base_url) =>{
        return query => {
            let numberPattern = /^\d{6,}$/g;
            let result_url=`${base_url}/items?search=`;
            if(query.match(numberPattern)){
                result_url = `${base_url}/items/`;
            }
            return `${result_url}${query}`;
        };
    },
    downloadExcelFile: (requestOptions) => (url,outputName,fetchParams, callback)=>{
        // let requestOptions = {
        //     method: "GET",
        // };
        let reqOptions=requestOptions;
        let file_extension="xlsx";
        if (fetchParams.hasOwnProperty("body")){
            reqOptions = {...reqOptions, ...fetchParams}
        }
        fetch(url, reqOptions)
        .then(response => response.blob()).then(blob => {
            // 2. Create blob link to download
            const url = window.URL.createObjectURL(new Blob([blob]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `${outputName}.${file_extension}`);  // 3. Append to html page
            document.body.appendChild(link);  // 4. Force download
            link.click();  // 5. Clean up and remove the link
            link.parentNode.removeChild(link);
            callback();
        })
    },
    existsAndPredicate : existsAndPredicate, 
    isPropertyGtZero : (property) => existsAndPredicate(isGtZero(property)),
    simpleJsonGet: (url)=>{
        let requestOptions = {
             method: "GET",
        };
        return fetch(url, requestOptions)
        .then(response =>{
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                throw new TypeError("Oops, we haven't got JSON!");
            }
            return response.json();
        })
    },
}
export default common_helpers;