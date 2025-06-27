// src/components/Stage1/FileUpload.tsx

'use client';

import { act, use, useEffect, useState } from 'react';

import './FileUploadStyling.css';

import {
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td
} from '@patternfly/react-table'

import {
  MultipleFileUpload,
  MultipleFileUploadMain,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  Button,
  Content,
  Flex,
  FlexItem,
  Tabs,
  Tab,
  TabTitleText,
  Toolbar,
  ToolbarContent,
  ToolbarItem,
  SearchInput,
  Checkbox,
  Pagination,
  Dropdown,
  DropdownList,
  DropdownItem,
  MenuToggle,
  MenuToggleElement,
  type DropEvent
} from '@patternfly/react-core';
import UploadIcon from '@patternfly/react-icons/dist/esm/icons/upload-icon';

type DuplicatePackage = {
  file: File;
  action: 'overwrite' | 'keepOriginal' | 'keepBoth';
}

interface FileUploadProps {
  workspaceFiles: File[];
  pageFiles: File[];
  setResources: (toOverwrite: File[], toUpload: File[]) => void;
  onOpen: () => void;
}

const FileUpload: React.FunctionComponent<FileUploadProps> = ({ workspaceFiles, pageFiles, setResources, onOpen }) => {
  const [fromDrop, setFromDrop] = useState<File[]>([]);

  const [duplicateFilePackages, setDuplicateFilePackages] = useState<DuplicatePackage[]>([]);
  const [showDuplicatesModal, setShowDuplicatesModal] = useState(false);

  const truncateThreshold = 3; // Number of duplicate files to show before truncating the list

  const allowedFileTypes: { [mime: string]: string[] } = {
    'application/pdf': ['.pdf'],
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
    'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.svg'],
    'text/html': ['.html'],
    'text/asciidoc': ['.adoc'],
    'text/markdown': ['.md']
  };

  const getFileStem = (file: File): string => {
    return file.name.split('.').slice(0, -1).join('.');
  }

  const findDuplicateFiles = (files: File[]): File[] => {
    const fileStems = files.map(file => getFileStem(file));
    const isDuplicate = fileStems.map((stem, index) => fileStems.indexOf(stem) !== index);
    return findUniqueFiles(files.filter((file, index) => isDuplicate[index]));
  }

  const findUniqueFiles = (files: File[]): File[] => {
    const fileStems = files.map(file => getFileStem(file));
    const isUnique = fileStems.map((stem, index) => fileStems.indexOf(stem) === index);
    return files.filter((file, index) => isUnique[index]);
  }

  // callback that will be called by the react dropzone with the newly dropped file objects
  const handleFileDrop = (_event: DropEvent, droppedFiles: File[]) => {
    // Close other menu's
    onOpen();

    // identify files that have conflicting names
    const duplicates = findDuplicateFiles([...workspaceFiles, ...pageFiles, ...droppedFiles]);

    if (duplicates.length) {
      setFromDrop(droppedFiles);
      setDuplicateFilePackages(duplicates.map(file => {
        return {
          file,
          action: 'keepBoth'
        }
      }));
      setPage(1);
      setPerPage(3);
      setActiveTabKey('all-files');
      setShowDuplicatesModal(true);
      return;
    }

    const currentFileNames = [...workspaceFiles, ...pageFiles].map((file) => file.name);
    const newFiles = droppedFiles.filter((droppedFile) => !currentFileNames.includes(droppedFile.name));

    updateCurrentFiles(newFiles);
  };

  const handleDuplicatesDecision = (action : 'overwrite' | 'keepBoth' |'keepOriginal' | null) => {
    const duplicateStems = duplicateFilePackages.map(pkg => getFileStem(pkg.file));
    let toUpload = fromDrop.filter(file => !duplicateStems.includes(getFileStem(file)));
    let toOverwrite: File[] = [];
    let suffixesStems: string[] = [];
    let keepOriginalStems: string[] = [];

    switch (action) {
      case 'overwrite':
        toOverwrite = duplicateFilePackages.map(pkg => pkg.file);
        break;
      case 'keepBoth':
        suffixesStems = duplicateFilePackages.map(pkg => getFileStem(pkg.file));
        break;
      case 'keepOriginal':
        keepOriginalStems = duplicateFilePackages.map(pkg => getFileStem(pkg.file));
        break;
      default:
        toOverwrite = duplicateFilePackages.filter(pkg => pkg.action === 'overwrite').map(pkg => pkg.file);
        suffixesStems = duplicateFilePackages.filter(pkg => pkg.action === 'keepBoth').map(pkg => getFileStem(pkg.file));
        keepOriginalStems = duplicateFilePackages.filter(pkg => pkg.action === 'keepOriginal').map(pkg => getFileStem(pkg.file));
        break;
    }

    // Files that are to be added with suffixes
    
    const toAddSuffixes = fromDrop.filter(file => suffixesStems.includes(getFileStem(file)));

    const allFiles = [...workspaceFiles, ...pageFiles, ...toUpload];
    let suffixedFiles: File[] = []
    
    for (const file of toAddSuffixes) {
      let fileStem = getFileStem(file);
      let nextSuffix = 1;
      const fileExtension = file.name.split('.').pop();

      while ([...suffixedFiles, ...allFiles].some(existingFile => getFileStem(existingFile) === fileStem)) {
        fileStem = `${getFileStem(file)}-${nextSuffix}`;
        nextSuffix++;
      }

      const renamedFile = new File([file], `${fileStem}.${fileExtension}`, { type: file.type });
      suffixedFiles.push(renamedFile);
    }
    
    // Files that are to be discarded, aside from the original
    
    const existingStems = [...workspaceFiles, ...pageFiles].map(file => getFileStem(file));
    let keptOriginalFiles: File[] = [];

    for (const stem of keepOriginalStems) {
      if (!existingStems.includes(stem)) {
        const newFile = fromDrop.find(file => getFileStem(file) === stem);
        if (newFile) {
          keptOriginalFiles.push(newFile);
        }
      }
    }

    // Add files
    setDuplicateFilePackages([]);
    setFromDrop([]);
    setShowDuplicatesModal(false);

    setResources(toOverwrite, [...toUpload, ...keptOriginalFiles, ...suffixedFiles]);
  }

  const cancelUpload = () => {
    setDuplicateFilePackages([]);
    setFromDrop([]);
    setShowDuplicatesModal(false);
  }

  const updateCurrentFiles = (files: File[]) => {
    setResources([], files);
  };

  const getDuplicateWarningText = () => {
    if (duplicateFilePackages.length > 1) {
      return (
        <>
          <Content component="p">The following file names are already in use in your workspace:</Content>
          {duplicateFilePackages.length > truncateThreshold ? (
            <>
              <Content component="ul">
                {duplicateFilePackages.slice(0, truncateThreshold - 1).map((filePackage) => (
                  <Content component="li" key={filePackage.file.name}>{getFileStem(filePackage.file)}</Content>
                ))}
                <Content component="li" key={duplicateFilePackages[truncateThreshold - 1].file.name}>
                  {getFileStem(duplicateFilePackages[truncateThreshold - 1].file)} (+{duplicateFilePackages.length - truncateThreshold} more)
                </Content>
              </Content>
            </>
          ) : (
            <Content component="ul">
              {duplicateFilePackages.map((filePackage) => (
                <Content component="li" key={filePackage.file.name}>{getFileStem(filePackage.file)}</Content>
              ))}
            </Content>
          )}
          <Content component="p">Please choose how to proceed.</Content>
        </>
      );
    }

    return (
      <>
        <Content component="p">
          The file name <strong>{getFileStem(duplicateFilePackages[0].file)}</strong> is already in use in your workspace.
        </Content>
        <Content component="p">
          Please choose how to proceed.
        </Content>
      </>
    );
  };

  // ----- TABS ------

  const [activeTabKey, setActiveTabKey] = useState<string | number>('all-files');

  const handleTabClick = (
    event: React.MouseEvent<any> | React.KeyboardEvent | MouseEvent,
    tabIndex: string | number
  ) => {
    setActiveTabKey(tabIndex);
  }

  // ----- FILE BY FILE ------

  const [searchQuery, setSearchQuery] = useState('');
  const [filteredDuplicateFilePackages, setFilteredDuplicateFilePackages] = useState<DuplicatePackage[]>([]);

  const [recentSelectedRowIndex, setRecentSelectedRowIndex] = useState<number | null>(null);
  const [shifting, setShifting] = useState(false);

  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(3);

  const [assignAllOpen, setAssignAllOpen] = useState(false);

  const onSetPage = (_event: React.MouseEvent | React.KeyboardEvent | MouseEvent, newPage: number) => {
    setPage(newPage);
  };

  const onPerPageSelect = (
    _event: React.MouseEvent | React.KeyboardEvent | MouseEvent,
    newPerPage: number,
    newPage: number
  ) => {
    setPerPage(newPerPage);
    setPage(newPage);
  };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Shift') {
        setShifting(true);
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Shift') {
        setShifting(false);
      }
    };

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('keyup', onKeyUp);
    };
  }, []);

  useEffect(() => {
    if (searchQuery) {
      setFilteredDuplicateFilePackages(duplicateFilePackages.filter(filePackage => filePackage.file.name.toLowerCase().includes(searchQuery.toLowerCase())));
    } else {
      setFilteredDuplicateFilePackages(duplicateFilePackages);
    }
  }, [searchQuery, duplicateFilePackages]);

  useEffect(() => {
    setRecentSelectedRowIndex(null);
    setPage(1);
  }, [searchQuery])

  const handleCheckboxChange = (filePackage: DuplicatePackage, rowIndex: number, action: "overwrite" | "keepOriginal" | "keepBoth") => {
    if (shifting && recentSelectedRowIndex !== null && filteredDuplicateFilePackages[recentSelectedRowIndex].action === action) {
      const numberSelected = rowIndex - recentSelectedRowIndex;
      const intermediateIndexes =
        numberSelected > 0
          ? Array.from(new Array(numberSelected + 1), (_x, i) => i + recentSelectedRowIndex)
          : Array.from(new Array(Math.abs(numberSelected) + 1), (_x, i) => i + rowIndex);
      const namesToChange = numberSelected > 0 ?
        filteredDuplicateFilePackages.slice(recentSelectedRowIndex, rowIndex + 1).map(pkg => pkg.file.name) :
        filteredDuplicateFilePackages.slice(rowIndex, recentSelectedRowIndex + 1).map(pkg => pkg.file.name);

      setDuplicateFilePackages(prev => 
        prev.map((pkg) => namesToChange.includes(pkg.file.name) ? { ...pkg, action: action } : pkg)
      );
    } else {
      setDuplicateFilePackages(prev => 
        prev.map((pkg) => pkg.file.name === filePackage.file.name ? { ...pkg, action: action } : pkg)
      );
    }

    setRecentSelectedRowIndex(rowIndex);
  }

  return (
    <>
      <MultipleFileUpload
        onFileDrop={handleFileDrop}
        dropzoneProps={{
          accept: allowedFileTypes
        }}
      >
        <MultipleFileUploadMain
          titleIcon={<UploadIcon />}
          titleText="Drag and drop files here"
          titleTextSeparator="or"
          infoText="Accepted file types: Markdown, AsciiDoc, Images (PNG, JPEG, WEBP), PDF, DOCX, XLSX, PPTX, HTML"
        />
      </MultipleFileUpload>

      {showDuplicatesModal && (
        <Modal
          isOpen
          disableFocusTrap
          variant="large"
          aria-label="duplicate file names warning"
          aria-labelledby="duplicate-file-names-warning-title"
          aria-describedby="duplicate-file-names-warning-variant"
        >
          <ModalHeader title="Duplicate File Names" labelId="duplicate-file-names-title" titleIconVariant="warning" />
          <ModalBody id="duplicate-file-names-variant">
            {duplicateFilePackages.length > 1 ? (
              <Tabs
                activeKey={activeTabKey}
                onSelect={handleTabClick}
                aria-label='Duplicate file name resolution modes'
                role='region'
              >
                <Tab className='spaced-tab' eventKey='all-files' title={<TabTitleText>All Files</TabTitleText>} aria-label='Default content - all files'>
                  {getDuplicateWarningText()}
                </Tab>
                <Tab className='spaced-tab' eventKey='file-by-file' title={<TabTitleText>File-by-File</TabTitleText>}>
                  <Toolbar>
                      <Flex justifyContent={{ default: 'justifyContentSpaceBetween' }} style={{ width: '100%', padding: '0rem 0.5rem' }}>
                        <FlexItem>
                          <ToolbarContent>
                            <ToolbarItem key='search'>
                              <SearchInput
                                placeholder="Find by name"
                                value={searchQuery}
                                onChange={(_event, value) => setSearchQuery(value)}
                                onClear={() => setSearchQuery('')}
                              />
                            </ToolbarItem>
                            <ToolbarItem key='assign-all'>
                              <Dropdown
                                isOpen={assignAllOpen}
                                onSelect={() => setAssignAllOpen(!assignAllOpen)}
                                onOpenChange={(isOpen) => setAssignAllOpen(isOpen)}
                                toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
                                  <MenuToggle ref={toggleRef} onClick={() => setAssignAllOpen(!assignAllOpen)} isExpanded={assignAllOpen} variant="secondary">
                                    Assign All
                                  </MenuToggle>
                                )}
                                ouiaId={"assign-all-dropdown"}
                              >
                                <DropdownList>
                                  <DropdownItem
                                    key="overwrite-all"
                                    onClick={() => {
                                      setDuplicateFilePackages(prev => prev.map(pkg => ({ ...pkg, action: 'overwrite' })));
                                      setAssignAllOpen(false);
                                    }}
                                  >
                                    Overwrite
                                  </DropdownItem>
                                  <DropdownItem
                                    key="keep-original-all"
                                    onClick={() => {
                                      setDuplicateFilePackages(prev => prev.map(pkg => ({ ...pkg, action: 'keepOriginal' })));
                                      setAssignAllOpen(false);
                                    }}
                                  >
                                    Keep Original
                                  </DropdownItem>
                                  <DropdownItem
                                    key="keep-both-all"
                                    onClick={() => {
                                      setDuplicateFilePackages(prev => prev.map(pkg => ({ ...pkg, action: 'keepBoth' })));
                                      setAssignAllOpen(false);
                                    }}
                                  >
                                    Keep Both
                                  </DropdownItem>
                                </DropdownList>
                              </Dropdown>
                            </ToolbarItem>
                          </ToolbarContent>
                        </FlexItem>
                        <FlexItem>
                          <ToolbarContent>
                            <ToolbarItem key='pagination'>
                              <Pagination
                                itemCount={filteredDuplicateFilePackages.length}
                                page={page}
                                perPage={perPage}
                                onSetPage={onSetPage}
                                onPerPageSelect={onPerPageSelect}
                                perPageOptions={[
                                  { title: '3', value: 3 },
                                  { title: '5', value: 5 },
                                  { title: '8', value: 8 },
                                  { title: '10', value: 10 }
                                ]}
                              />
                            </ToolbarItem>
                          </ToolbarContent>
                        </FlexItem>
                      </Flex>
                  </Toolbar>
                  <Table>
                    <Thead>
                      <Tr>
                        <Th className="first">
                          File Name                      
                        </Th>
                        <Th>
                          Overwrite
                        </Th>
                        <Th>
                          Keep Original
                        </Th>
                        <Th>
                          Keep Both
                        </Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {filteredDuplicateFilePackages.length > 0 && (
                        filteredDuplicateFilePackages.slice((page - 1) * perPage, Math.min(page * perPage, filteredDuplicateFilePackages.length)).map((filePackage, index) => (
                          <Tr key={filePackage.file.name}>
                            <Td dataLabel="File Name" style={{ width: '500px'}}>
                              {getFileStem(filePackage.file)}
                            </Td>
                            <Td dataLabel="Overwrite">
                              <Checkbox 
                                className='centered'
                                id="overwrite-checkbox"
                                isChecked={filePackage.action === 'overwrite'}
                                onChange={(_event, checked) => {handleCheckboxChange(filePackage, (page - 1) * perPage + index, "overwrite")}}
                              />
                            </Td>
                            <Td dataLabel="Keep Original">
                              <Checkbox 
                                id="keep-original-checkbox" 
                                isChecked={filePackage.action === 'keepOriginal'}
                                onChange={(_event, checked) => {handleCheckboxChange(filePackage, (page - 1) * perPage + index, "keepOriginal")}}
                              />
                            </Td>
                            <Td dataLabel="Keep Both" className='centered'>
                              <Checkbox
                                id="keep-both-checkbox" 
                                isChecked={filePackage.action === 'keepBoth'}
                                onChange={(_event, checked) => {handleCheckboxChange(filePackage, (page - 1) * perPage + index, "keepBoth")}}
                              />
                            </Td>
                          </Tr>
                        )))}
                    </Tbody>
                  </Table>
                  {filteredDuplicateFilePackages.length === 0 && (
                    <Flex justifyContent={{ default: 'justifyContentCenter' }} style={{ width: '100%', marginTop: '1.5rem' }}>
                      <FlexItem>
                        <Content component="p">No files match your search</Content>
                      </FlexItem>
                    </Flex>
                  )}
                </Tab>
              </Tabs>
            ) : (
              <div style={{ marginTop: '1rem' }}>
                {getDuplicateWarningText()}
              </div>
            )}
          </ModalBody>
          <ModalFooter>
            {activeTabKey === 'all-files' || duplicateFilePackages.length == 1 ? (
              <Flex style={{ width: "100%" }} justifyContent={{ default: 'justifyContentSpaceBetween' }}>
                <FlexItem>
                  <Button key="overwrite" variant="secondary" onClick={cancelUpload}>
                    Cancel
                  </Button>
                </FlexItem>

                <FlexItem>
                  <Flex gap={{ default: 'gapSm'}}>
                    <FlexItem>
                      <Button key="keep-original-files" variant="secondary" onClick={() => handleDuplicatesDecision('keepOriginal')}>
                        Keep original file{duplicateFilePackages.length > 1 && 's'} {duplicateFilePackages.length > 1 && `(${duplicateFilePackages.length})`}
                      </Button>
                    </FlexItem>
                    <FlexItem>
                      <Button key="overwrite" variant="danger" onClick={() => handleDuplicatesDecision('overwrite')}>
                        Overwrite {duplicateFilePackages.length > 1 && `(${duplicateFilePackages.length})`}
                      </Button>
                    </FlexItem>
                    <FlexItem>
                      <Button key="keep-both-files" variant="primary" onClick={() => handleDuplicatesDecision('keepBoth')}>
                        Keep both files {duplicateFilePackages.length > 1 && `(${duplicateFilePackages.length})`}
                      </Button>
                    </FlexItem>
                  </Flex>
                </FlexItem>
              </Flex>  
            ) : (
              <Flex style={{ width: "100%" }} justifyContent={{ default: 'justifyContentSpaceBetween' }}>
                <FlexItem>
                  <Button key="overwrite" variant="secondary" onClick={cancelUpload}>
                    Cancel
                  </Button>
                </FlexItem>

                <FlexItem>
                  <Button key="resolve-with-settings" variant="primary" onClick={() => handleDuplicatesDecision(null)}>
                    Resolve With Settings
                  </Button>
                </FlexItem>
              </Flex>  
            )}
          </ModalFooter>
        </Modal>
      )}
    </>
  );
};

export default FileUpload;