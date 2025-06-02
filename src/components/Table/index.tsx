import './index.css';

import { useState, useRef, useEffect } from 'react';

export type Column<T> = {
  header: string;
  type: string;
  accessor: keyof T;
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
}

function Table<T>({ columns, data }: TableProps<T>): React.ReactElement {
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);
  const [activeRow, setActiveRow] = useState<number | null>(null);
  const [clickedRow, setClickedRow] = useState<number | null>(null);
  const [selectedRows, setSelectedRows] = useState<number[]>([]);

  const tableRef = useRef<HTMLDivElement>(null);

  const handleMouseEnter = (rowIndex: number) => {
    setHoveredRow(rowIndex);
  };

  const handleMouseLeave = () => {
    setHoveredRow(null);
  };

  const handleMouseDown = (rowIndex: number) => {
    setActiveRow(rowIndex);
  }

  const handleMouseUp = () => {
    setActiveRow(null);
  }

  const handleTableClick = () => {
    setClickedRow(hoveredRow);
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (tableRef.current && !tableRef.current.contains(event.target as Node)) {
        setHoveredRow(null);
        setActiveRow(null);
        setClickedRow(null);
        setSelectedRows([]);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [])

  return (
    <div className='table-container'>
      <div className='table-header'>
        {columns.map((column, columnIndex) => (
            <div className={`table-column ${column.type}`} key={columnIndex}>
              <div key={columnIndex} className='header-cell'>
                {String(column.header)}
              </div>
            </div>
        ))}
      </div>
      <div className='table-body' ref={tableRef} onClick={handleTableClick}>
        {columns.map((column, columnIndex) => (
          <div className={`table-column ${column.type}`} key={columnIndex}>
            {data.map((row, rowIndex) => (
              <div key={rowIndex} onMouseDown={() => handleMouseDown(rowIndex)} onMouseUp={handleMouseUp} onMouseLeave={() => handleMouseLeave()} onMouseEnter={() => handleMouseEnter(rowIndex)} className={`body-cell ${rowIndex === activeRow && 'active'} ${rowIndex === hoveredRow && 'hovered'} ${rowIndex === clickedRow && 'clicked'}`}>
                {String(row[column.accessor])}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export default Table;