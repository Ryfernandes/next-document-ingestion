// src/components/FormElements/TextArea/index.tsx

'use client';

import { useState, useEffect } from 'react';

import './index.css';

interface TextAreaProps {
  placeholder?: string;
  value: string;
  setValue: (value: string) => void;
  errors: string[];
  maxCharacters?: number;
  disabled?: boolean;
}

export const TextArea: React.FunctionComponent<TextAreaProps> = ({ placeholder, value, setValue, errors, maxCharacters, disabled }) => {
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
      <textarea
        placeholder={placeholder || "Enter text..."}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="text-area"
        rows={4}
        disabled={disabled}
      />
      {helperText.length > 0 && (
        <p className={`helper-text ${errors.length && 'error'}`}>{helperText}</p>
      )}
    </>
  )
}