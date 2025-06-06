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

export type Column<T> = {
  header: string;
  type: string;
  accessor: keyof T;
  display: string;
  multiselectOptions?: [];
}

interface dataPair<T> {
  value: T;
  display: T;
}

interface TableProps<T> {
  columns: Column<T>[];
  data: dataPair<T>[];
  reconcileData: (data: T[]) => void;
  noContentText: string;
  removeButton?: boolean;
  removeTitles: string[];
  removeTexts: string[];
}

function Table<T>({ columns, data, reconcileData, noContentText, removeButton, removeTitles, removeTexts }: TableProps<T>): React.ReactElement {
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);
  const [activeRow, setActiveRow] = useState<number | null>(null);
  const [multiselectAnchor, setMultiselectAnchor] = useState<number | null>(null);
  const [selectedRows, setSelectedRows] = useState<number[]>([]);
  const [lastRowRange, setLastRowRange] = useState<number[]>([]);

  const [isShiftDown, setIsShiftDown] = useState(false);
  const [isControlDown, setIsControlDown] = useState(false);

  const [sortBy, setSortBy] = useState<keyof T | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc' | null>(null);
  const [sortedData, setSortedData] = useState<dataPair<T>[]>(data);

  const [toRemove, setToRemove] = useState<number[]>([]);
  const [showRemoveModal, setShowRemoveModal] = useState(false);

  const tableRef = useRef<HTMLDivElement>(null);

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

  const setHeaderSort = (column: Column<T>) => {
    if (!sortedData.length) return;

    if (column.accessor === sortBy) {
      setSortDirection(prevDirection => prevDirection === 'asc' ? 'desc' : 'asc');
    }

    setSortBy(column.accessor);
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
    setToRemove([]);

    reconcileData(sortedData.filter((_, index) => !toRemove.includes(index)).map(row => row.value));
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

  return (
    <div className='table-container'>
      <div className={`table-header ${sortedData.length > 6 && 'shifted'}`}>
        {columns.map((column, columnIndex) => (
            <div className={`table-column ${column.type}`} key={columnIndex}>
              <div key={columnIndex} className={`header-cell ${sortedData.length && "clickable"}`} onClick={() => setHeaderSort(column)}>
                <div>
                  {String(column.header)}
                </div>
                <div>
                  {sortBy === column.accessor && (sortDirection === 'asc' ? '↑' : '↓')}
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
      <div className='table-body' onMouseLeave={cleanUpTable} ref={tableRef} onClick={handleTableClick}>
        {columns.map((column, columnIndex) => (
          <div className={`table-column ${column.type}`} key={columnIndex}>
            {sortedData.map((row, rowIndex) => {
              if (column.display === 'default') return (
                <div key={rowIndex} onMouseDown={() => handleMouseDown(rowIndex)} onMouseUp={handleMouseUp} onMouseLeave={() => handleMouseLeave()} onMouseEnter={() => handleMouseEnter(rowIndex)} className={`body-cell ${isControlDown && "pointer"} ${isShiftDown && "no-select"} ${rowIndex === activeRow && 'active'} ${rowIndex === hoveredRow && 'hovered'} ${selectedRows.includes(rowIndex) && 'clicked'}`}>
                  {String(row.display[column.accessor])}
                </div>
              );
            })}
          </div>
        ))}
        {removeButton && (
          <div className={'table-column remove'}>
            {sortedData.map((row, rowIndex) => {
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