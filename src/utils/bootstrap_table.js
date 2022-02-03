import React  from 'react';
import { zipObject } from 'lodash';
import Form from 'react-bootstrap/Form';
import common_helpers from './common';
import {compose, nth, split, invoker} from 'ramda';

const identity_fn = x=>x;
const identity_fn2 = (x,y) => [x, y];
const empty_fn = ()=>{};
const isLengthGtZero = common_helpers.isPropertyGtZero("length");
const toISOStringDate = compose(nth(0), split("T"), invoker(0, 'toISOString'));
const diffDay = (d1, d2) => Math.ceil((d1-d2)/ (1000 * 60 * 60 * 24));
const table_helpers = {
    //
    falseFn: (content, row, rowIndex, columnIndex) => false,
    trueFn: (content, row, rowIndex, columnIndex) => true,
    buildColumnData: function buildColumnData(arrayOfValues, labels, transform_fn=identity_fn2) {
        let columns_data = arrayOfValues.reduce(
            (total, currentValues) => {
                let [arrayOfLabels, currentArrayValues] = transform_fn(labels, currentValues);
                return total.concat(zipObject(arrayOfLabels, currentArrayValues));
            },
          []
        );
        return columns_data;
    },
    renderFormGroupDetails :  (formGroupProps, label, formControlProps)=>{
        return (
            <>
                <Form.Group {...formGroupProps}>
                    <Form.Label>{label}</Form.Label>
                    <Form.Control {...formControlProps}></Form.Control>
                </Form.Group>
            </>
        )
    },
    buildHandleOnSelect: (getFunction, setFunction)=>{
        return (row, isSelect) => {
            // row.id 1-based index
            // selectedItems 0-based index
            if (isSelect) {
                setFunction(() => ({
                selected: [...getFunction().selected, row.id]
              }));
            } else {
                setFunction(() => ({
                selected: getFunction().selected.filter(x => x !== row.id)
              }));
            }
          };
    },
    buildHandleAllOnSelect: (setFunction)=>{
        return ((isSelect, rows) => {
            const ids = rows.map(r => r.id);
            if (isSelect) {
                setFunction(() => ({
                selected: ids
                }));
            } else {
                setFunction(() => ({
                selected: []
              }));
            }
        });
    },
    buildCsvExport: (props) => {
            const handleClick = () => {
              props.onExport();
            };
            return (
              <div>
                <button className="btn btn-primary" onClick={ handleClick }>Export to CSV</button>
              </div>
            );
    },
    expandHeaderColumnRenderer: ({ isAnyExpands }) => {
        // Hack to center the expand symbol in the header
        if (isAnyExpands) {
          return <div style={{textAlign:"center"}}><b>-</b></div>;
        }
        return <div style={{textAlign:"center"}}><b>+</b></div>;
      },
    expandColumnRenderer: ({ expanded }) => {
        if (expanded) {
          return (
            <b>(&nbsp;-&nbsp;)</b>
          );
        }
        return (
          <b>...</b>
        );
    },
    rowStyleColors : (row, rowIndex) => {
      const gainsboro = '#DCDCDC';
      const peach_orange='#ffcc99';
      const light_coral = '#f08080';
      const preavis_jours = 60;
      const style = {};
      if (isLengthGtZero("comments")(row)) {
        style.backgroundColor = gainsboro;
      }
      if(isLengthGtZero("dluo")(row)){
        let today = new Date();
        let dluo = new Date(row.dluo);
        let diffInDays = diffDay(dluo, today);
        if (diffInDays<0){
          style.backgroundColor=light_coral;
        }
        else if (diffInDays<preavis_jours){
          style.backgroundColor = peach_orange;
        }
      }
      return style;
    }
};
table_helpers.buildGroupDetails = arrayParams => {
    let [control_id, label, type_, placeholder_, value_, readOnly_, onChange_, onFocus_, ...rest]=arrayParams;
    const fields = ["type", "placeholder", "value","readOnly", "onChange", "onFocus", "tabIndex"];

    return table_helpers.renderFormGroupDetails({controlId: control_id}
    ,label
    , {type: type_,placeholder:placeholder_,value:value_||""
    , readOnly:readOnly_
    , onChange:onChange_
    , onFocus:onFocus_
    , tabIndex:rest[0]})
};
export default table_helpers;