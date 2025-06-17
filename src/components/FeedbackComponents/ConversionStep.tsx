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
  Content,
  MenuToggleElement,
  Dropdown,
  DropdownItem,
  DropdownList,
  Divider
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
import CheckCircleIcon from '@patternfly/react-icons/dist/esm/icons/check-circle-icon';
import FileAlt from '@patternfly/react-icons/dist/esm/icons/outlined-file-alt-icon';
import FileCode from '@patternfly/react-icons/dist/esm/icons/outlined-file-code-icon';
import FileExcel from '@patternfly/react-icons/dist/esm/icons/outlined-file-excel-icon';
import FileIcon from '@patternfly/react-icons/dist/esm/icons/outlined-file-icon';
import FileImage from '@patternfly/react-icons/dist/esm/icons/outlined-file-image-icon';
import FilePDF from '@patternfly/react-icons/dist/esm/icons/outlined-file-pdf-icon';
import FilePowerpoint from '@patternfly/react-icons/dist/esm/icons/outlined-file-powerpoint-icon';
import FileWord from '@patternfly/react-icons/dist/esm/icons/outlined-file-word-icon';

type Resource = {
  datetimeUploaded: Date;
  originalFile: File | null;
  file: File;
  conversionProfile: string;
}

type ConversionStepProps = {

}

// Later, add workspace file support

const ConversionStep: React.FunctionComponent<ConversionStepProps> = ({  }) => {
  const [page, setPage] = useState(1);
  const [showConversionProfiles, setShowConversionProfiles] = useState(false);
  const [showDocumentation, setShowDocumentation] = useState(false);

  const workspaceFiles: File[] = [];

  // ------ CARD THINGS ------

  const [expandedGroupNames, setExpandedGroupNames] = useState<string[]>([]);
  const setGroupExpanded = (group: string, isExpanding = true) =>
    setExpandedGroupNames((prevExpanded) => {
      const otherExpandedGroupNames = prevExpanded.filter((groupName) => groupName !== group);
      return isExpanding ? [...otherExpandedGroupNames, group] : otherExpandedGroupNames;
    });
  const isGroupExpanded = (group: string) => expandedGroupNames.includes(group);

  const [conversionRequiredResources, setConversionRequiredResources] = useState<Resource[]>([]);
  const [uploadCompleteResources, setUploadCompleteResources] = useState<Resource[]>([]);

  const [selectedConversionRequiredFileNames, setSelectedConversionRequiredFileNames] = useState<string[]>([]);
  const [selectedUploadCompleteFileNames, setSelectedUploadCompleteFileNames] = useState<string[]>([]);

  const setResourceSelected = (resource: Resource, isSelecting = true, group: string) => {
    if (group === 'conversion-required') {
      setSelectedConversionRequiredFileNames((prevSelected) => {
        const otherSelectedFileNames = prevSelected.filter((file_name) => file_name !== resource.file.name);
        return isSelecting ? [...otherSelectedFileNames, resource.file.name] : otherSelectedFileNames;
      });
    } else if (group === 'upload-complete') {
      setSelectedUploadCompleteFileNames((prevSelected) => {
        const otherSelectedFileNames = prevSelected.filter((file_name) => file_name !== resource.file.name);
        return isSelecting ? [...otherSelectedFileNames, resource.file.name] : otherSelectedFileNames;
      });
    }
  }

  const selectAllFiles = (isSelecting = true, group: string) => {
    if (group === 'conversion-required') {
      setSelectedConversionRequiredFileNames(isSelecting ? conversionRequiredResources.map((resource) => resource.file.name) : []);
    } else if (group === 'upload-complete') {
      setSelectedUploadCompleteFileNames(isSelecting ? uploadCompleteResources.map((resource) => resource.file.name) : []);
    }
  }

  const areAllConversionRequiredResourcesSelected = selectedConversionRequiredFileNames.length === conversionRequiredResources.length;
  const areAllUploadCompleteResourcesSelected = selectedUploadCompleteFileNames.length === uploadCompleteResources.length;

  const isResourceSelected = (resource: Resource) => [...selectedConversionRequiredFileNames, ...selectedUploadCompleteFileNames].includes(resource.file.name);

  const [recentSelectedRowIndex, setRecentSelectedRowIndex] = useState<number | null>(null);
  const [shifting, setShifting] = useState(false);

  const onSelectResource = (resource: Resource, rowIndex: number, isSelecting: boolean) => {
    if (shifting && recentSelectedRowIndex !== null) {
      const numberSelected = rowIndex - recentSelectedRowIndex;
      const intermediateIndexes =
        numberSelected > 0
          ? Array.from(new Array(numberSelected + 1), (_x, i) => i + recentSelectedRowIndex)
          : Array.from(new Array(Math.abs(numberSelected) + 1), (_x, i) => i + rowIndex);
      intermediateIndexes.forEach((index) => setResourceSelected([...conversionRequiredResources, ...uploadCompleteResources][index], isSelecting, index < conversionRequiredResources.length ? 'conversion-required' : 'upload-complete'));
    } else {
      setResourceSelected(resource, isSelecting, rowIndex < conversionRequiredResources.length ? 'conversion-required' : 'upload-complete');
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

  const getFileStem = (file: File): string => {
    return file.name.split('.').slice(0, -1).join('.');
  }

  const onUpload = (toOverwrite: File[], toUpload: File[]) => {
    const newConversionRequiredResources = conversionRequiredResources.filter(
      (resource) => !toOverwrite.some(fileToRemove => getFileStem(fileToRemove) === getFileStem(resource.file))
    );

    const newUploadCompleteResources = uploadCompleteResources.filter(
      (resource) => !toOverwrite.some(fileToRemove => getFileStem(fileToRemove) === getFileStem(resource.file))
    );

    setConversionRequiredResources(() => {
      const selectFiles = [...toOverwrite, ...toUpload].filter((file) => file.type !== 'text/markdown')
      const newResouces = selectFiles.map((file) => {
        return ({
          "datetimeUploaded": new Date(),
          "originalFile": null,
          "file": file,
          "conversionProfile": "Default"
        })
      })

      return [...newConversionRequiredResources, ...newResouces];
    })

    setUploadCompleteResources(() => {
      const selectFiles = [...toOverwrite, ...toUpload].filter((file) => file.type === 'text/markdown')
      const newResouces = selectFiles.map((file) => {
        return ({
          "datetimeUploaded": new Date(),
          "originalFile": null,
          "file": file,
          "conversionProfile": "None"
        })
      })

      return [...newUploadCompleteResources, ...newResouces];
    })
  }

  const fileTypeTranslations: { [key: string]: string } = {
    'application/pdf': 'PDF',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'DOCX',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'PPTX',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'XLSX',
    'image/*': 'Image',
    'text/html': 'HTML',
    'text/asciidoc': 'AsciiDoc',
    'text/markdown': 'Markdown'
  }

  const sizeForDisplay = (size: number): string => {
    if (size < 1024) {
      return `${size} B`;
    } else if (size < 1024 * 1024) {
      return `${(size / 1024).toFixed(2)} KB`;
    } else if (size < 1024 * 1024 * 1024) {
      return `${(size / (1024 * 1024)).toFixed(2)} MB`;
    } else {
      return `${(size / (1024 * 1024 * 1024)).toFixed(2)} GB`;
    }
  }

  const getfileIcon = (type: string) => {
    switch (type) {
      case 'application/pdf':
        return <Icon><FilePDF /></Icon>;
      case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        return <Icon><FilePowerpoint /></Icon>;
      case 'application/vnd.openxmlformats-officedocument.presentationml.presentation':
        return <Icon><FileWord /></Icon>;
      case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
        return <Icon><FileExcel /></Icon>;
      case 'image/*':
        return <Icon><FileImage /></Icon>;
      case 'text/html':
        return <Icon><FileCode /></Icon>;
      case 'text/asciidoc':
        return <Icon><FileAlt /></Icon>;
      case 'text/markdown':
        return <Icon><FileAlt /></Icon>;
      case 'default':
        return <Icon><FileIcon /></Icon>;
    }
  }

  const formatDate = (date: Date) => {
    const options: Intl.DateTimeFormatOptions = {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: 'America/New_York',
    };
  
    const formatter = new Intl.DateTimeFormat('en-US', options);
    const formattedDate = formatter.format(date);
  
    return `Uploaded ${formattedDate} EST`;
  }``

  return (
    <>
      <ConversionHeader setShowConversionProfiles={setShowConversionProfiles} setShowDocumentation={setShowDocumentation} />
      <Flex style={{ marginTop: '4rem', width: '100%' }}>
        <FlexItem style={{width: '20rem'}} alignSelf={{ default: 'alignSelfFlexStart'}}>
          <FileUpload
            workspaceFiles={workspaceFiles}
            pageFiles={[...conversionRequiredResources.map((r) => r.file), ...uploadCompleteResources.map((r) => r.file)]}
            setResources={onUpload}
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
                  <Badge style={{ transform: 'translateY(-2.5px)' }} screenReaderText="Uploaded Resources">{[...conversionRequiredResources, ...uploadCompleteResources].length}</Badge>
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
                      isSelected: areAllConversionRequiredResourcesSelected && conversionRequiredResources.length > 0
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
                          <Badge style={{ transform: 'translateY(-1px)' }} screenReaderText="Conversion Required">{conversionRequiredResources.length}</Badge>
                        </FlexItem>
                      </Flex>
                    </Th>
                    {isGroupExpanded('conversion-required') && conversionRequiredResources.length > 0 && (
                      <>
                        <Th screenReaderText='Empty'/>
                        <Th screenReaderText='Empty'/>
                        <Th screenReaderText='Select conversion profile'>Select conversion profile</Th>
                        <Th screenReaderText='Empty'/>
                      </>
                    )}
                  </Tr>
                </Thead>
                <Tbody>
                  {isGroupExpanded('conversion-required') && conversionRequiredResources.map((resource, index) => (
                    <Tr key={index} className='conversion-required-row fat-row'>
                      <Td/>
                      <Td select={{
                          rowIndex: index,
                          isSelected: isResourceSelected(resource),
                          onSelect: (_event, isSelecting) => onSelectResource(resource, index, isSelecting),
                        }}
                      />
                      <Td>{resource.file.name}</Td>
                      <Td>
                        <Flex>
                          <FlexItem>
                            {getfileIcon(resource.file.type)}
                          </FlexItem>
                          <FlexItem>
                            {fileTypeTranslations[resource.file.type] || 'Unknown'}
                          </FlexItem>
                        </Flex>
                      </Td>
                      <Td>{sizeForDisplay(resource.file.size)}</Td>
                      <Td>Dropdown placeholder</Td>
                      <Td>Menu placeholder</Td>
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
                      isSelected: areAllUploadCompleteResourcesSelected && uploadCompleteResources.length > 0
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
                          <Badge style={{ transform: 'translateY(-1px)' }} screenReaderText="Uploaded complete">{uploadCompleteResources.length}</Badge>
                        </FlexItem>
                      </Flex>
                    </Th>
                    {isGroupExpanded('upload-complete') && uploadCompleteResources.length > 0 && (
                      <>
                        <Th screenReaderText='Empty'/>
                        <Th screenReaderText='Empty'/>
                        <Th screenReaderText='Empty'/>
                        <Th screenReaderText='Empty'/>
                      </>
                    )}
                  </Tr>
                </Thead>
                <Tbody key='upload-complete'>
                  {isGroupExpanded('upload-complete') && uploadCompleteResources.map((resource, index) => (
                    <Tr key={index} className="upload-complete-row fat-row">
                      <Td/>
                      <Td select={{
                        rowIndex: conversionRequiredResources.length + index,
                        isSelected: isResourceSelected(resource),
                        onSelect: (_event, isSelecting) => onSelectResource(resource, conversionRequiredResources.length + index, isSelecting),
                      }}/>
                      <Td>{resource.file.name}</Td>
                      <Td>
                        <Flex>
                          <FlexItem>
                            {getfileIcon(resource.file.type)}
                          </FlexItem>
                          <FlexItem>
                            {fileTypeTranslations[resource.file.type] || 'Unknown'}
                          </FlexItem>
                        </Flex>
                      </Td>
                      <Td>{sizeForDisplay(resource.file.size)}</Td>
                      <Td>{formatDate(resource.datetimeUploaded)}</Td>
                      <Td>Menu placeholder</Td>
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