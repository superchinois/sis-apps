import React, {useState} from 'react';
import Button from 'react-bootstrap/Button';

const btnStyle = {padding:"0 0 0 0"}
export default function WithModal(Component, Modal) {
    return (props) => {
        const [tag, setTag] = useState(props.tag);
        const [show, setShow] = useState(false);
        const handleClose = () => setShow(false);
        const handleShow = () => setShow(true);
        const handleTagChange = (event) => {
            let inputId = event.target.id;
            let newValue = event.target.value;
            switch (inputId) {
                case "pu_ht":
                    setTag(Object.assign({},tag,{"pu_ttc":parseFloat(newValue*(1+tag.rate/100)).toFixed(2),
                    [inputId]: newValue}));
                    break;
                case "description_size":
                    setTag(Object.assign({}, tag, {[inputId]: event.tag.description_size}));
                    break;
                case "itemname":
                    setTag(Object.assign({}, tag, {[inputId]: newValue}));
                    break;
                default:
                    console.log("switch default case");
                    console.log(inputId);
                    break;
            }
            };
        return (
            <div>
                <Component tag={tag}
                renderButton={(element) => (
                    <Button variant="link" onClick={handleShow} style={btnStyle}>
                        {element}
                    </Button>
                )} 
                />
                <Modal 
                show={show} 
                handleClose={handleClose}
                tag={tag}
                handleTagChange={handleTagChange}
                />
            </div>
        );
    }
    
}