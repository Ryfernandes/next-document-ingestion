// src/components/FeedbackComponents/ConversionHeader.tsx

'use client';

import PageHeader from '@patternfly/react-component-groups/dist/dynamic/PageHeader';
import {
  Content,
  Icon,
  Button,
  Breadcrumb,
  BreadcrumbItem
} from '@patternfly/react-core';

import OpenDrawerRightIcon from '@patternfly/react-icons/dist/esm/icons/open-drawer-right-icon';
import ExternalLinkIcon from '@patternfly/react-icons/dist/esm/icons/external-link-alt-icon';

import React from 'react';

type ConversionHeaderProps = {
  openConversionProfiles: () => void;
  setShowDocumentation: React.Dispatch<React.SetStateAction<boolean>>;
}

const ConversionHeader: React.FunctionComponent<ConversionHeaderProps> = ({ openConversionProfiles, setShowDocumentation }) => {
  const handleConversionProfilesClick = () => {
    openConversionProfiles();
  }

  const toggleDocumentation = () => {
    setShowDocumentation(prev => !prev);
  }

  return (
    <>
      <PageHeader
        breadcrumbs={
          <Breadcrumb>
            <BreadcrumbItem>Section Home</BreadcrumbItem>
            <BreadcrumbItem to="#">Section title</BreadcrumbItem>
            <BreadcrumbItem to="#">Section title</BreadcrumbItem>
            <BreadcrumbItem to="#" isActive>Section title</BreadcrumbItem>
          </Breadcrumb>
        }
        title="Add resources to a workspace"
      >
        <Content component="p" style={{ marginTop: '1rem'}}>
          Have suggestions/feedback or want to learn more about this demo?{" "}
          <Content component="a" href="https://docs.google.com/document/d/1Zeahs6F1Bn_0yJiFY6vLqsgcyL1jVvrWC5SYKK0HAZM/edit?usp=sharing" target="_blank" rel="noopener noreferrer">
            Check out the planning doc
            <Icon isInline size="sm" style={{ marginLeft: '0.25rem', marginRight: '0.4rem' }}>
              <ExternalLinkIcon color="#0066CC"/>
            </Icon>
          </Content>
          {" "}(Red Hat employees only) or{" "}
          <Content component="a" href="https://github.com/Ryfernandes/next-document-ingestion" target="_blank" rel="noopener noreferrer">
            visit the GitHub repository
            <Icon isInline size="sm" style={{ marginLeft: '0.25rem', marginRight: '0.4rem' }}>
              <ExternalLinkIcon color="#0066CC"/>
            </Icon>
          </Content>
        </Content>
        <Content component="p" style={{ marginTop: '1rem'}}>
          Resources such as textbooks, technical manuals, encyclopedias, journals, or websites are used as the knowledge source for training your model. 
          Files must be converted to Markdown format before being added to the workspace. 
          You can convert files and customize conversion profiles below or use{" "}
            <Content component="a" href="https://github.com/docling-project/docling" target="_blank" rel="noopener noreferrer">
              Docling
              <Icon isInline size="sm" style={{ marginLeft: '0.25rem', marginRight: '0.4rem' }}>
                <ExternalLinkIcon color="#0066CC"/>
              </Icon>
            </Content> 
          locally to convert before uploading.{" "}
            <Button variant="link" isInline component="span" onClick={handleConversionProfilesClick}>
              Manage conversion profiles
            </Button>
        </Content>
        <Button variant="link" isInline component="span" onClick={toggleDocumentation}>
          Learn more about accepted sources
            <Icon size="bodySm" style={{ marginLeft: '0.5rem' }}>
              <OpenDrawerRightIcon color="#0066CC"/>
            </Icon>
        </Button>
      </PageHeader>
    </>
  );
}

export default ConversionHeader;