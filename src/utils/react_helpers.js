import React  from 'react';
const getRowById = (items, id)=>{
    let ids = items.map(_=>_.id);
    let rowIndex = ids.indexOf(id);
    return rowIndex;
};
let react_helpers = {
    displayIf: (conditionFn, Component) => {
        return (props) => {
            return (<>
                {conditionFn() ?
                    <Component {...props}/>
                :null
                }
            </>);
        }
    },
    dataReducer: (initialData) => (state, action)=>{
        switch(action.type) {
            case 'UPDATE_ITEMS':
                let items = state.items
                let rowIndex = getRowById(items, action.item_id);
                let updatedRow = Object.assign({}, items[rowIndex], action.data);
                items[rowIndex] = updatedRow;
                return Object.assign({}, state, {items: items});
            case 'ADD_DATA':
                return Object.assign({}, state, {[action.id]:action.data});
            case 'REMOVE_DATA':
                const {[action.id]:data, ...new_data} = state;
                return new_data;
            case 'RESET_DATA':
                return initialData;
            default:
                return state;
        }
    },
    getRowById: getRowById,
};

export default react_helpers;