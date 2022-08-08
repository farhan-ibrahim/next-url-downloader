import React, { useState } from 'react';
import { useEffect } from 'react';
import styles from '../../styles/Home.module.css'


type Props = {
    index:number,
    url: string,
    multiple: boolean,
    isLast: boolean,
    onAdd: () => void;
    onRemove: () => void;
    onChange:(url:string) => void
}

const Item = (props:Props) => {
    const [ value, setValue ] = useState('');

    useEffect(() => {
        props.onChange(value)  ;
    },[value])

    return(
        <div className={styles.item} >
            {props.multiple && props.isLast && (
                <button  
                    onClick={props.onRemove}
                    className={styles.addBtn}
                >-</button>
            )}
            <input 
                value={value}
                onChange={e => {
                    setValue(e.target.value);
                }}
                placeholder='Enter your url here : ex https://www.google.com'
                className={styles.input}
            />
            {props.isLast && (
                <button  
                    onClick={props.onAdd}
                    className={styles.addBtn}
                >+</button>
            )}
         
      </div>
    )
}


export default Item