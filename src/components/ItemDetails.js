import React, {useState} from 'react';
import Form from 'react-bootstrap/Form';
import {zipObject} from 'lodash';
import RackTag from './tags/TagRack';


const FIELDS=[
    'itemcode',
    'itemname',
    'vendu',
    'unite_vente',
    'pack_description',
    'pack_subdescription',
    'volumic_description',
    'computeUnit',
    'computePack',
    'computeVolum',
]
const paramKeys=["field","controlId", "label", "type", "placeholder", "desc"];
const fieldParams = [
    ["itemname","itemnameId", "Item name", "text", "Enter itemname",""],
    ["vendu","venduId", "Vendu", "text", "Enter how it is sold",""],
    ["unite_vente","unite_venteId", "Prix unitaire", "text", "Enter how it is sold unitary",""],
    ['pack_description', 'pack_descriptionId',"Prix au pack", "text", "How it sold in pack", "Mettre un x pour ne pas afficher"],
    ['pack_subdescription','pack_subdescriptionId',"Details pack", "text", "description detail", ""],
    ['volumic_description','volumic_descriptionId',"Prix volumic", "text", "How it sold in volume", "Mettre un x pour ne pas afficher"],
];

function buildData(paramKeys, fieldParams) {
    let result = fieldParams.map(param =>zipObject(paramKeys, param));
    return result;
}
function FieldFormGroup(params){
    const {field, controlId, label, type, placeholder, desc} = params;
    return (props) =>
    {
        return (
        <Form.Group controlId={controlId}>
            <Form.Label>{label}</Form.Label>
            <Form.Control key={field} type={type} placeholder={placeholder} 
            value={props.tag[[field]]||""}
            onChange={props.handleChange}/>
            {desc ?
            <Form.Text className="text-muted">
                {desc}
            </Form.Text>
            : null
            }   
        </Form.Group>
        )
    }
}
const Fields = buildData(paramKeys, fieldParams).map(f=>FieldFormGroup(f));

export default function ItemDetails(props) {
    const [tag, setTag]=useState(props.tag);
    const handleChange = (event) => {
            let t = event.target;
            let field=t.id.replace("Id",""); // hack to get the field name
            setTag({...tag, [field]:t.value});
    }
    return (
        <>
        {Fields.map((FormComponent, index)=><FormComponent key={index} tag={tag} handleChange={handleChange}/>)}
        <br/>
        <RackTag tag={tag} renderButton={(x)=>x}/>
        </>
    );
}