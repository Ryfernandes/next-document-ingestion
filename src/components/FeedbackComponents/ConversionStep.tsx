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
                <Tbody key='conversion-required'>
                  <Tr className='conversion-required-header fat-row'>
                    <Td expand={{
                      rowIndex: 0,
                      isExpanded: isGroupExpanded('conversion-required'),
                      onToggle: () => setGroupExpanded('conversion-required', !isGroupExpanded('conversion-required')),
                      expandId: 'conversion-required',
                    }}
                    />
                    <Td>
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
                          <Badge style={{ transform: 'translateY(-1px)' }} screenReaderText="Uploaded Resources">{uploadedFiles.filter((file) => file.type != 'text/markdown').length}</Badge>
                        </FlexItem>
                      </Flex>
                    </Td>
                    <Td/>
                    <Td/>
                    <Td>{isGroupExpanded('conversion-required') && 'Select conversion profile'}</Td>
                  </Tr>
                  {isGroupExpanded('conversion-required') && uploadedFiles.filter((file) => file.type != 'text/markdown').map((file, index) => (
                    <Tr key={index} className='conversion-required-row fat-row'>
                      <Td/>
                      <Td>{file.name}</Td>
                      <Td>{file.type || 'Unknown'}</Td>
                      <Td>{(file.size / 1024).toFixed(2)} KB</Td>
                      <Td>{new Date(file.lastModified).toLocaleDateString()}</Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
              <Table>
                <Tbody key='upload-complete'>
                  <Tr className='upload-complete-header fat-row'>
                    <Td expand={{
                      rowIndex: 0,
                      isExpanded: isGroupExpanded('upload-complete'),
                      onToggle: () => setGroupExpanded('upload-complete', !isGroupExpanded('upload-complete')),
                      expandId: 'upload-complete',
                    }}
                    />
                    <Td>
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
                          <Badge style={{ transform: 'translateY(-1px)' }} screenReaderText="Uploaded Resources">{uploadedFiles.filter((file) => file.type == 'text/markdown').length}</Badge>
                        </FlexItem>
                      </Flex>
                    </Td>
                    <Td/>
                    <Td/>
                    <Td/>
                  </Tr>
                  {isGroupExpanded('upload-complete') && uploadedFiles.filter((file) => file.type == 'text/markdown').map((file, index) => (
                    <Tr key={index} className="upload-complete-row fat-row">
                      <Td/>
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