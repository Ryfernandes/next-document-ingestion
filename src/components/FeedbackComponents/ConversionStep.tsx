// src/components/FeedbackComponents/ConversionStep.tsx

'use client';

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
  Button
} from '@patternfly/react-core';

import { useState } from 'react';

import ConversionHeader from './ConversionHeader';
import FileUpload from './FileUpload';

type ConversionStepProps = {

}

const ConversionStep: React.FunctionComponent<ConversionStepProps> = ({  }) => {
  const [page, setPage] = useState(1);
  const [showConversionProfiles, setShowConversionProfiles] = useState(false);
  const [showDocumentation, setShowDocumentation] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);

  const workspaceFiles: File[] = [];

  // ------ CARD THINGS ------

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
                        <MenuToggleCheckbox id="split-button-checkbox"/>
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
            <CardBody>Body</CardBody>
          </Card>
        </FlexItem>
      </Flex>
    </>
  );
}

export default ConversionStep;