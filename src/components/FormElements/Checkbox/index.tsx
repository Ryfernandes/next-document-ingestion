// src/components/FormElements/Checkbox/index.tsx

import './index.css';

import { useState } from 'react';

interface CheckboxProps {
  value: boolean;
  setValue: (value: boolean) => void;
  disabled?: boolean;
}

export const Checkbox: React.FunctionComponent<CheckboxProps> = ({ value, setValue, disabled }) => {
  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.checked);
  }

  return (
    <input disabled={disabled} type="checkbox" checked={value} className='checkbox' onChange={onChange}/>
  )
}