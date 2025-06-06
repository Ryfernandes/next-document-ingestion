// src/components/FormElements/DropdownMenu/index.tsx

import './index.css';

import { useState } from 'react';

interface DropdownMenuProps {
  options: { label: string, value: string }[];
  value: string;
  setValue: (value: string) => void;
  disabled?: boolean;
}

export const DropdownMenu: React.FunctionComponent<DropdownMenuProps> = ({ options, value, setValue, disabled }) => {
  const [menuOpen, setMenuOpen] = useState<boolean>(false);
  const [hoverIndex, setHoverIndex] = useState<number>(-1);

  const toggleMenu = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setMenuOpen(prev => !prev);
  }

  const handleSelect = (rowNumber: number) => {
    setValue(options[rowNumber].value);
    setHoverIndex(-1);
    setMenuOpen(false);
  }

  const blurClose = () => {
    if (hoverIndex < 0) {
      setMenuOpen(false);
    }
  }
  
  return (
    <div className='dropdown' onBlur={blurClose}>
      <button disabled={disabled} className='dropdown-label' onClick={toggleMenu}>
        <div>
          {options.find(o => o.value === value)?.label || "Select an option"}
        </div>
        {!disabled && (
          <div className='arrow'>
            ∨
          </div>
        )}
      </button>
      <div className={`dropdown-menu ${menuOpen && 'open'}`}>
        {options.map((option, index) => (
          <div className={`dropdown-item ${hoverIndex === index && 'hover'}`} onMouseEnter={() => setHoverIndex(index)} onMouseLeave={() => setHoverIndex(-1)} onClick={(e: React.MouseEvent<HTMLDivElement>) => {e.stopPropagation(); handleSelect(index);}} key={index}>
            <div>
              {option.label}
            </div>
            {option.value === value && (
              <div className='checkmark'>
                ✓
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}