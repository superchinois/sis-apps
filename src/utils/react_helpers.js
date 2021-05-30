import React  from 'react';

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
    }
};

export default react_helpers;