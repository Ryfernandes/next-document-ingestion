// src/components/FeedbackComponents/ConversionStep.tsx

'use client';

import './TableStyling.css';

import {
  Flex,
  FlexItem,
  Card,
  CardTitle,
  CardBody,
  Badge,
  Toolbar,
  ToolbarItem,
  ToolbarContent,
  SearchInput,
  MenuToggleCheckbox,
  MenuToggle,
  Button,
  Icon,
  Content
} from '@patternfly/react-core';

import {
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td
} from '@patternfly/react-table'

import { useState, useEffect } from 'react';

import ConversionHeader from './ConversionHeader';
import FileUpload from './FileUpload';

import WarningIcon from '@patternfly/react-icons/dist/esm/icons/exclamation-triangle-icon';
import CheckIcon, { CheckCircleIcon } from '@patternfly/react-icons/dist/esm/icons/check-circle-icon';

type ConversionStepProps = {

}

const ConversionStep: React.FunctionComponent<ConversionStepProps> = ({  }) => {
  const [page, setPage] = useState(1);
  const [showConversionProfiles, setShowConversionProfiles] = useState(false);
  const [showDocumentation, setShowDocumentation] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);

  const workspaceFiles: File[] = [];

  // ------ CARD THINGS ------

  const [expandedGroupNames, setExpandedGroupNames] = useState<string[]>([]);
  const setGroupExpanded = (group: string, isExpanding = true) =>
    setExpandedGroupNames((prevExpanded) => {
      const otherExpandedGroupNames = prevExpanded.filter((groupName) => groupName !== group);
      return isExpanding ? [...otherExpandedGroupNames, group] : otherExpandedGroupNames;
    });
  const isGroupExpanded = (group: string) => expandedGroupNames.includes(group);

  const [conversionRequiredFiles, setConversionRequiredFiles] = useState<File[]>([]);
  const [uploadCompleteFiles, setUploadCompleteFiles] = useState<File[]>([]);

  const [selectedConversionRequiredFileNames, setSelectedConversionRequiredFileNames] = useState<string[]>([]);
  const [selectedUploadCompleteFileNames, setSelectedUploadCompleteFileNames] = useState<string[]>([]);

  const setFileSelected = (file: File, isSelecting = true, group: string) => {
    if (group === 'conversion-required') {
      setSelectedConversionRequiredFileNames((prevSelected) => {
        const otherSelectedFileNames = prevSelected.filter((file_name) => file_name !== file.name);
        return isSelecting ? [...otherSelectedFileNames, file.name] : otherSelectedFileNames;
      });
    } else if (group === 'upload-complete') {
      setSelectedUploadCompleteFileNames((prevSelected) => {
        const otherSelectedFileNames = prevSelected.filter((file_name) => file_name !== file.name);
        return isSelecting ? [...otherSelectedFileNames, file.name] : otherSelectedFileNames;
      });
    }
  }

  const selectAllFiles = (isSelecting = true, group: string) => {
    if (group === 'conversion-required') {
      setSelectedConversionRequiredFileNames(isSelecting ? conversionRequiredFiles.map((file) => file.name) : []);
    } else if (group === 'upload-complete') {
      setSelectedUploadCompleteFileNames(isSelecting ? uploadCompleteFiles.map((file) => file.name) : []);
    }
  }

  const areAllConversionRequiredFilesSelected = selectedConversionRequiredFileNames.length === conversionRequiredFiles.length;
  const areAllUploadCompleteFilesSelected = selectedUploadCompleteFileNames.length === uploadCompleteFiles.length;

  const isFileSelected = (file: File) => [...selectedConversionRequiredFileNames, ...selectedUploadCompleteFileNames].includes(file.name);

  const [recentSelectedRowIndex, setRecentSelectedRowIndex] = useState<number | null>(null);
  const [shifting, setShifting] = useState(false);

  const onSelectFile = (file: File, rowIndex: number, isSelecting: boolean) => {
    if (shifting && recentSelectedRowIndex !== null) {
      const numberSelected = rowIndex - recentSelectedRowIndex;
      const intermediateIndexes =
        numberSelected > 0
          ? Array.from(new Array(numberSelected + 1), (_x, i) => i + recentSelectedRowIndex)
          : Array.from(new Array(Math.abs(numberSelected) + 1), (_x, i) => i + rowIndex);
      intermediateIndexes.forEach((index) => setFileSelected([...conversionRequiredFiles, ...uploadCompleteFiles][index], isSelecting, index < conversionRequiredFiles.length ? 'conversion-required' : 'upload-complete'));
    } else {
      setFileSelected(file, isSelecting, rowIndex < conversionRequiredFiles.length ? 'conversion-required' : 'upload-complete');
    }
    setRecentSelectedRowIndex(rowIndex);
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
    setConversionRequiredFiles(uploadedFiles.filter((file) => file.type !== 'text/markdown'));
    setUploadCompleteFiles(uploadedFiles.filter((file) => file.type === 'text/markdown'));
  }, [uploadedFiles])

  return (
    <>
      <ConversionHeader setShowConversionProfiles={setShowConversionProfiles} setShowDocumentation={setShowDocumentation} />
      <Flex style={{ marginTop: '4rem', width: '100%' }}>
        <FlexItem style={{width: '20rem'}} alignSelf={{ default: 'alignSelfFlexStart'}}>
          <FileUpload
            workspaceFiles={workspaceFiles}
            uploadedFiles={uploadedFiles}
            setUploadedFiles={setUploadedFiles}
          />
        </FlexItem>
        <FlexItem flex={{ default: 'flex_1' }} alignSelf={{ default: 'alignSelfFlexStart'}}>
          <Card>
            <CardTitle>
              <Flex>
                <FlexItem>
                  Uploaded Resources
                </FlexItem>
                <FlexItem>
                  <Badge style={{ transform: 'translateY(-2.5px)' }} screenReaderText="Uploaded Resources">{uploadedFiles.length}</Badge>
                </FlexItem>
              </Flex>

              <Toolbar style={{ marginTop: '2.5rem' }}>
                <ToolbarContent>
                  <ToolbarItem key="checkbox">
                    <MenuToggle
                      splitButtonItems={[
                        <MenuToggleCheckbox key="split-button-checkbox" id="split-button-checkbox"/>
                      ]}
                    >
                    </MenuToggle>
                  </ToolbarItem>
                  <ToolbarItem key="search">
                    <SearchInput 
                      placeholder="Find by name"
                    />
                  </ToolbarItem>
                  <ToolbarItem key="convert-button">
                    <Button variant="primary">Convert</Button>
                  </ToolbarItem>
                  <ToolbarItem key="actions-menu">
                    <MenuToggle variant="secondary">Actions</MenuToggle>
                  </ToolbarItem>
                </ToolbarContent>
              </Toolbar>
            </CardTitle>
            <CardBody>
              <Table>
                <Thead className='conversion-required-header'>
                  <Tr className='fat-row'>
                    <Th expand={{
                      areAllExpanded: !isGroupExpanded('conversion-required'),
                      collapseAllAriaLabel: 'Collapse all',
                      onToggle: () => setGroupExpanded('conversion-required', !isGroupExpanded('conversion-required')),
                    }} screenReaderText='Empty'
                    />
                    <Th select={{
                      onSelect: (_event, isSelecting) => selectAllFiles(isSelecting, 'conversion-required'),
                      isSelected: areAllConversionRequiredFilesSelected && conversionRequiredFiles.length > 0
                    }} screenReaderText='Empty'
                    />
                    <Th>
                      <Flex>
                        <FlexItem>
                          <Icon >
                            <WarningIcon color="#FFCC17" />
                          </Icon>
                        </FlexItem>
                        <FlexItem>
                          <Content component='p' style={{ fontWeight: 'bold' }}>
                            Conversion required
                          </Content>
                        </FlexItem>
                        <FlexItem>
                          <Badge style={{ transform: 'translateY(-1px)' }} screenReaderText="Conversion Required">{uploadedFiles.filter((file) => file.type !== 'text/markdown').length}</Badge>
                        </FlexItem>
                      </Flex>
                    </Th>
                    <Th screenReaderText='Empty'/>
                    <Th screenReaderText='Empty'/>
                    <Th screenReaderText='Empty'/>
                  </Tr>
                </Thead>
                <Tbody>
                  {isGroupExpanded('conversion-required') && conversionRequiredFiles.map((file, index) => (
                    <Tr key={index} className='conversion-required-row fat-row'>
                      <Td/>
                      <Td select={{
                          rowIndex: index,
                          isSelected: isFileSelected(file),
                          onSelect: (_event, isSelecting) => onSelectFile(file, index, isSelecting),
                        }}
                      />
                      <Td>{file.name}</Td>
                      <Td>{file.type || 'Unknown'}</Td>
                      <Td>{(file.size / 1024).toFixed(2)} KB</Td>
                      <Td>{new Date(file.lastModified).toLocaleDateString()}</Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
              <Table>
                <Thead className='upload-complete-header'>
                  <Tr className='fat-row'>
                    <Th expand={{
                      areAllExpanded: !isGroupExpanded('upload-complete'),
                      collapseAllAriaLabel: 'Collapse all',
                      onToggle: () => setGroupExpanded('upload-complete', !isGroupExpanded('upload-complete')),
                    }} screenReaderText='Empty'
                    />
                    <Th select={{
                      onSelect: (_event, isSelecting) => selectAllFiles(isSelecting, 'upload-complete'),
                      isSelected: areAllUploadCompleteFilesSelected && uploadCompleteFiles.length > 0
                    }} screenReaderText='Empty'
                    />
                    <Th>
                      <Flex>
                        <FlexItem>
                          <Icon >
                            <CheckCircleIcon color="#3D7317" />
                          </Icon>
                        </FlexItem>
                        <FlexItem>
                          <Content component='p' style={{ fontWeight: 'bold' }}>
                            Upload complete
                          </Content>
                        </FlexItem>
                        <FlexItem>
                          <Badge style={{ transform: 'translateY(-1px)' }} screenReaderText="Uploaded complete">{uploadedFiles.filter((file) => file.type === 'text/markdown').length}</Badge>
                        </FlexItem>
                      </Flex>
                    </Th>
                    <Th screenReaderText='Empty'/>
                    <Th screenReaderText='Empty'/>
                    <Th screenReaderText='Empty'/>
                  </Tr>
                </Thead>
                <Tbody key='upload-complete'>
                  {isGroupExpanded('upload-complete') && uploadCompleteFiles.map((file, index) => (
                    <Tr key={index} className="upload-complete-row fat-row">
                      <Td/>
                      <Td select={{
                        rowIndex: conversionRequiredFiles.length + index,
                        isSelected: isFileSelected(file),
                        onSelect: (_event, isSelecting) => onSelectFile(file, conversionRequiredFiles.length + index, isSelecting),
                      }}/>
                      <Td>{file.name}</Td>
                      <Td>{file.type || 'Unknown'}</Td>
                      <Td>{(file.size / 1024).toFixed(2)} KB</Td>
                      <Td>{new Date(file.lastModified).toLocaleDateString()}</Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </CardBody>
          </Card>
        </FlexItem>
      </Flex>
    </>
  );
}

export default ConversionStep;