import './index.css';

import { useState, useRef, useEffect } from 'react';

import {
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Flex,
  FlexItem,
  Button,
  Content
} from '@patternfly/react-core';

import { DropdownMenu } from '@/components/FormElements/DropdownMenu';

export type DefaultDisplay = {
  type: "default";
}

export interface Dropdown<T> {
  type: "dropdown-menu";
  options: { label: string, id: number }[];
  onChange: ( id: number, selectedRows: T[] ) => void;
}

export interface ActionButton<T> {
  type: "action-button";
  onClick: (row: T) => void;
  innerComponent: React.ReactNode;
}

export type ColumnDisplay<T> = DefaultDisplay | ActionButton<T> | Dropdown<T>;

export type Column<T, TDisplay> = {
  header: string;
  type: string;
  data_accessor: keyof T;
  display_accessor: keyof TDisplay;
  display: ColumnDisplay<T>;
  disable_sort?: boolean;
}

interface dataPair<T, TDisplay> {
  value: T;
  display: TDisplay;
  permanent?: boolean | null;
}

interface TableProps<T, TDisplay> {
  columns: Column<T, TDisplay>[];
  data: dataPair<T, TDisplay>[];
  reconcileData: (data: T[]) => void;
  noContentText: string;
  removeButton?: boolean;
  removeTitles: string[];
  removeTexts: string[];
}

function Table<T, TDisplay>({ columns, data, reconcileData, noContentText, removeButton, removeTitles, removeTexts }: TableProps<T, TDisplay>): React.ReactElement {
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);
  const [activeRow, setActiveRow] = useState<number | null>(null);
  const [multiselectAnchor, setMultiselectAnchor] = useState<number | null>(null);
  const [selectedRows, setSelectedRows] = useState<number[]>([]);
  const [lastRowRange, setLastRowRange] = useState<number[]>([]);

  const [isShiftDown, setIsShiftDown] = useState(false);
  const [isControlDown, setIsControlDown] = useState(false);

  const [sortBy, setSortBy] = useState<keyof T | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc' | null>(null);
  const [sortedData, setSortedData] = useState<dataPair<T, TDisplay>[]>(data);

  const [toRemove, setToRemove] = useState<number[]>([]);
  const [showRemoveModal, setShowRemoveModal] = useState(false);

  const [oldDataLength, setOldDataLength] = useState<number>(data.length);

  const tableRef = useRef<HTMLDivElement>(null);

  const isDefaultDisplay = (display: ColumnDisplay<T>): display is DefaultDisplay => {
    return display.type === 'default';
  }

  const isActionButton = (display: ColumnDisplay<T>): display is ActionButton<T> => {
    return display.type === 'action-button';
  }

  const isDropdown = (display: ColumnDisplay<T>): display is Dropdown<T> => {
    return display.type === 'dropdown-menu';
  }

  const getRowRange = (start: number, end: number): number[] => {
    const step = start <= end ? 1 : -1;
    const length = Math.abs(end - start) + 1;
    return Array.from({ length }, (_, i) => start + i * step);
  }

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

  const setHeaderSort = (column: Column<T, TDisplay>) => {
    if (!sortedData.length || column.disable_sort) return;

    if (column.data_accessor === sortBy) {
      setSortDirection(prevDirection => prevDirection === 'asc' ? 'desc' : 'asc');
    }

    setSortBy(column.data_accessor);
  }

  const handleRemoveAllClick = () => {
    if (sortedData.length > 0) {
      setToRemove(sortedData.map((_, index) => index));
      setShowRemoveModal(true);
    }
  }

  const handleXClick = (event: React.MouseEvent<HTMLDivElement>, rowIndex: number) => {
    if (!isControlDown) {
      event.stopPropagation();

      if (selectedRows.includes(rowIndex)) {
        setToRemove(selectedRows);
      } else {
        setToRemove([rowIndex]);
      }
  
      setShowRemoveModal(true);
    }
  }

  const getRemoveTitle = () => {
    if (toRemove.length === 1) {
      return removeTitles[0];
    }

    if (toRemove.length === sortedData.length) {
      return removeTitles[1];
    }

    return removeTitles[2];
  }

  const getRemoveEntriesText = () => {
    if (toRemove.length === 1) {
      return <Content component="p">{removeTexts[0]}</Content>;
    }

    if (toRemove.length === sortedData.length) {
      return <Content component="p">{removeTexts[1]}</Content>;
    }
    
    return <Content component="p">{removeTexts[2]}</Content>;
  }

  const cancelRemove = () => {
    setToRemove([]);
    setShowRemoveModal(false);
  }

  const removeEntries = () => {
    setShowRemoveModal(false);

    reconcileData(sortedData.filter((row, index) => row.permanent || !toRemove.includes(index)).map(row => row.value));

    setToRemove([]);
  }

  const handleTableClick = () => {
    if (!isShiftDown) {
      setMultiselectAnchor(hoveredRow)
      setLastRowRange([hoveredRow ?? 0]);

      if (isControlDown) {
        setSelectedRows(prevSelected => {
          if (prevSelected.includes(hoveredRow ?? 0)) {
            return prevSelected.filter(row => row !== hoveredRow);
          } else {
            return [...prevSelected, hoveredRow ?? 0];
          }
        });
      } else {
        setSelectedRows(hoveredRow !== null ? [hoveredRow] : []);
      }
    } else {
      if (isControlDown) {
        setMultiselectAnchor(hoveredRow)
        setLastRowRange([hoveredRow ?? 0]);

        setSelectedRows(prevSelected => {
          if (prevSelected.includes(hoveredRow ?? 0)) {
            return prevSelected.filter(row => row !== hoveredRow);
          } else {
            return [...prevSelected, hoveredRow ?? 0];
          }
        });
      } else {
        const heldRows = selectedRows.filter(row => !lastRowRange.includes(row));

        setSelectedRows([...heldRows, ...getRowRange(multiselectAnchor ?? 0, hoveredRow ?? 0)]);
        setLastRowRange(getRowRange(multiselectAnchor ?? 0, hoveredRow ?? 0));
      }
    }
  }

  const cleanUpTable = () => {
    setHoveredRow(null);
    setActiveRow(null);
  }

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (tableRef.current && !tableRef.current.contains(event.target as Node)) {
        setHoveredRow(null);
        setActiveRow(null);
        setMultiselectAnchor(null);
        setLastRowRange([]);
        setSelectedRows([]);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Shift') {
        setIsShiftDown(true);
      } else if (event.key === 'Control' || event.key === 'Meta') {
        setIsControlDown(true);
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.key === 'Shift') {
        setIsShiftDown(false);
      } else if (event.key === 'Control' || event.key === 'Meta') {
        setIsControlDown(false);
      }
    };

    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
    };
  }, [])

  useEffect(() => {
    if(!data.length) {
      setSortBy(null);
      setSortDirection(null);
      setSortedData(data);
      return;
    }

    if (sortBy) {
      const sorted = [...data].sort((a, b) => {
        const valueA = a.value[sortBy];
        const valueB = b.value[sortBy];

        if (valueA < valueB) return sortDirection === 'asc' ? -1 : 1;
        if (valueA > valueB) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
      setSortedData(sorted);
    } else {
      setSortedData(data);
    }
  }, [data, sortBy, sortDirection]);

  useEffect(() => {
    if (sortedData.length > oldDataLength) {
      tableRef.current?.scrollTo({ top: tableRef.current.scrollHeight });
    }

    setOldDataLength(sortedData.length);
  }, [sortedData]);

  return (
    <div className='table-container'>
      <div className={`table-header ${sortedData.length > 6 && 'shifted'}`}>
        {columns.map((column, columnIndex) => (
            <div className={`table-column ${!column.type.includes("custom") && column.type}`} style={column.type.includes('custom') ? { width: `${column.type.split('-')[1]}px` } : undefined} key={columnIndex}>
              <div key={columnIndex} className={`header-cell ${column.display.type === "action-button" && "center"} ${sortedData.length && "clickable"}`} onClick={() => setHeaderSort(column)}>
                <div>
                  {String(column.header)}
                </div>
                <div>
                  {sortBy === column.data_accessor && (sortDirection === 'asc' ? '↑' : '↓')}
                </div>
              </div>
            </div>
        ))}
        {removeButton && (
          <div className={`table-column remove`}>
            <div className={`header-cell remove ${sortedData.length && "clickable"}`} onClick={() => handleRemoveAllClick()}>
              X
            </div>
          </div>
        )}
      </div>
      <div className={`table-body ${sortedData.length <= 6 && 'show-overflow'}`} onMouseLeave={cleanUpTable} ref={tableRef} onClick={handleTableClick}>
        {columns.map((column, columnIndex) => (
          <div className={`table-column ${!column.type.includes("custom") && column.type}`} style={column.type.includes('custom') ? { width: `${column.type.split('-')[1]}px` } : undefined} key={columnIndex}>
            {sortedData.map((row, rowIndex) => {
              if (isDefaultDisplay(column.display)) {
                return (
                  <div key={rowIndex} onMouseDown={() => handleMouseDown(rowIndex)} onMouseUp={handleMouseUp} onMouseLeave={() => handleMouseLeave()} onMouseEnter={() => handleMouseEnter(rowIndex)} className={`body-cell ${isControlDown && "pointer"} ${isShiftDown && "no-select"} ${rowIndex === activeRow && 'active'} ${rowIndex === hoveredRow && 'hovered'} ${selectedRows.includes(rowIndex) && 'clicked'}`}>
                    {String(row.display[column.display_accessor])}
                  </div>
              )};
              if (isActionButton(column.display)) {
                const actionDisplay = column.display as ActionButton<T>;
                return (
                  <div key={rowIndex} onMouseDown={() => handleMouseDown(rowIndex)} onMouseUp={handleMouseUp} onMouseLeave={() => handleMouseLeave()} onMouseEnter={() => handleMouseEnter(rowIndex)} className={`body-cell center ${isControlDown && "pointer"} ${isShiftDown && "no-select"} ${rowIndex === activeRow && 'active'} ${rowIndex === hoveredRow && 'hovered'} ${selectedRows.includes(rowIndex) && 'clicked'}`}>
                    <div className='action-button' onClick={() => actionDisplay.onClick(row.value)}>
                      {actionDisplay.innerComponent}
                    </div>
                  </div>
              )};
              if (isDropdown(column.display)) {
                const dropdownDisplay = column.display as Dropdown<T>;
                return (
                  <div key={rowIndex} onMouseDown={() => handleMouseDown(rowIndex)} onMouseUp={handleMouseUp} onMouseLeave={() => handleMouseLeave()} onMouseEnter={() => handleMouseEnter(rowIndex)} className={`body-cell ${isControlDown && "pointer"} ${isShiftDown && "no-select"} ${rowIndex === activeRow && 'active'} ${rowIndex === hoveredRow && 'hovered'} ${selectedRows.includes(rowIndex) && 'clicked'}`}>
                    <DropdownMenu
                      options={dropdownDisplay.options.map((entry) => ({ label: entry.label, value: entry.id.toString() }))}
                      value={String(row.value[column.data_accessor])}
                      setValue={(value) => dropdownDisplay.onChange(parseInt(value), selectedRows.includes(rowIndex) ? selectedRows.map(num => sortedData[num].value) : [row.value])}
                    />
                  </div>
                )
              }
            })}
          </div>
        ))}
        {removeButton && (
          <div className={'table-column remove'}>
            {sortedData.map((row, rowIndex) => {
              if (row.permanent) {
                return (
                  <div key={rowIndex} onMouseDown={() => handleMouseDown(rowIndex)} onMouseUp={handleMouseUp} onMouseLeave={() => handleMouseLeave()} onMouseEnter={() => handleMouseEnter(rowIndex)} className={`body-cell remove ${isControlDown && "pointer"} ${isShiftDown && "no-select"} ${rowIndex === activeRow && 'active'} ${rowIndex === hoveredRow && 'hovered'} ${selectedRows.includes(rowIndex) && 'clicked'}`}>
                    <div className={'normal-x no-select'}>
                      
                    </div>
                  </div>
                )
              }

              return (
                <div key={rowIndex} onMouseDown={() => handleMouseDown(rowIndex)} onMouseUp={handleMouseUp} onMouseLeave={() => handleMouseLeave()} onMouseEnter={() => handleMouseEnter(rowIndex)} className={`body-cell remove ${isControlDown && "pointer"} ${isShiftDown && "no-select"} ${rowIndex === activeRow && 'active'} ${rowIndex === hoveredRow && 'hovered'} ${selectedRows.includes(rowIndex) && 'clicked'}`}>
                  <div className={`${!isControlDown && 'clickable-x'} normal-x no-select`} onMouseDown={(event) => event.stopPropagation()} onClick={(event) => {handleXClick(event, rowIndex);}}>
                    x
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      {!sortedData.length && (
        <div className='no-content'>
          {noContentText}
        </div>
      )}

      {showRemoveModal && (
        <Modal
          isOpen
          disableFocusTrap
          variant="small"
          aria-label="remove entries warning"
          aria-labelledby="remove-entries-warning-title"
          aria-describedby="remove-riles-warning-variant"
        >
          <ModalHeader title={getRemoveTitle()} labelId="remove-entries-title" titleIconVariant="danger" />
          <ModalBody id="remove-entries-variant">{getRemoveEntriesText()}</ModalBody>
          <ModalFooter>
            <Flex style={{ width: "100%" }} justifyContent={{ default: 'justifyContentSpaceBetween' }}>
              <FlexItem>
                <Button key="cancel" variant="secondary" onClick={cancelRemove}>
                  Cancel
                </Button>
              </FlexItem>

              <FlexItem>
                <Button key="remove" variant="danger" onClick={removeEntries}>
                  Remove
                </Button>
              </FlexItem>
            </Flex>
          </ModalFooter>
        </Modal>
      )}
    </div>
  );
}

export default Table;