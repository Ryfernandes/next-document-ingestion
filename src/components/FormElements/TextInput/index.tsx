// src/components/FormElements/TextInput/index.tsx

'use client';

import { useState, useEffect } from 'react';

import './index.css';

interface TextInputProps {
  placeholder?: string;
  value: string;
  setValue: (value: string) => void;
  errors: string[];
  maxCharacters?: number;
}

export const TextInput: React.FunctionComponent<TextInputProps> = ({ placeholder, value, setValue, errors, maxCharacters }) => {
  const [helperText, setHelperText] = useState<string>("");

  useEffect(() => {
    if (errors.length) {
      setHelperText(errors[0]);
    } else if (maxCharacters) {
      setHelperText(`${value.length}/${maxCharacters} characters`);
    } else {
      setHelperText("");
    }
  }, [errors, value])
  
  return (
    <>
      <input
        type="text"
        placeholder={placeholder || "Enter text..."}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="text-input"
      />
      {helperText.length > 0 && (
        <p className={`helper-text ${errors.length && 'error'}`}>{helperText}</p>
      )}
    </>
  )
}