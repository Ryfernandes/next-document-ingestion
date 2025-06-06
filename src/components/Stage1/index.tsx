// src/components/Stage1/index.tsx

'use client';

import {
  Button,
  Content,
  Flex,
  FlexItem,
  HelperText,
  HelperTextItem
} from '@patternfly/react-core';

import InfoIcon from '@patternfly/react-icons/dist/esm/icons/info-icon';

import { useState, useEffect } from 'react';

import FileUpload from '@/components/Stage1/FileUpload';
import Table from '@/components/Table';
import type { Column } from '@/components/Table';

interface Stage1Props {
  workspaceFiles: File[];
  uploadedFiles: File[];
  nextStage: (files: File[]) => void;
}

type fileEntry = {
  name: string;
  type: string;
  size: string | number;
};

const Stage1: React.FunctionComponent<Stage1Props> = ({ workspaceFiles, nextStage, uploadedFiles }) => {

  const [files, setFiles] = useState<File[]>(uploadedFiles);

  const columns: Column<fileEntry>[] = [
    { header: "Name", accessor: "name", type: "expands", display: "default" },
    { header: "Type", accessor: "type", type: "md", display: "default" },
    { header: "Size", accessor: "size", type: "sm", display: "default" }
  ];

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

  const reconcileMarkdown = (data: fileEntry[]) => {
    setFiles(oldFiles => oldFiles.filter(file => file.type !== 'text/markdown' || data.some(d => d.name === file.name)));
  }

  const reconcileNonMarkdown = (data: fileEntry[]) => {
    setFiles(oldFiles => oldFiles.filter(file => file.type === 'text/markdown' || data.some(d => d.name === file.name)));
  }

  return (
    <Flex direction={{ default: 'column' }} rowGap={{ default: 'rowGap2xl'}}>
      <FlexItem>
        <Flex direction={{ default: 'column' }} rowGap={{ default: 'rowGapMd'}}>
          <FlexItem>
            <Content component='h1'>Step 1. Select files</Content>
          </FlexItem>
          <FlexItem>
            <Content component='p'>Select files from your computer to be processed and uploaded to our service. Files with conflicting names will be changed by default</Content>
          </FlexItem>
        </Flex>
      </FlexItem>

      <FlexItem>
        <FileUpload workspaceFiles={workspaceFiles} uploadedFiles={files} setUploadedFiles={setFiles} />
      </FlexItem>

      <FlexItem>
        <Flex direction={{ default: 'column' }} rowGap={{ default: 'rowGapMd'}}>
          <FlexItem>
            <Content component='h2'>Ready</Content>
          </FlexItem>
          <FlexItem>
            <Content component='p'>The following files were uploaded in the Markdown format and can be added to the workspace directly</Content>
          </FlexItem>
          <FlexItem>
            <HelperText>
              <HelperTextItem icon={<InfoIcon />}>
                Use SHIFT and CTRL to select and remove multiple files
              </HelperTextItem>
            </HelperText>
          </FlexItem>

          <FlexItem>
            <Table<fileEntry> 
              columns={columns} 
              data={files.filter(file => file.type == 'text/markdown').map((file) => ({
                value: {
                  name: file.name,
                  type: fileTypeTranslations[file.type] || file.type,
                  size: file.size,
                },
                display: {
                  name: file.name,
                  type: fileTypeTranslations[file.type] || file.type,
                  size: sizeForDisplay(file.size)
                }
              }))}
              reconcileData={reconcileMarkdown}
              noContentText="No uploads of this type"
              removeTitles={["Remove file?", "Remove all?", "Remove selected files?"]}
              removeTexts={["Are you sure you want to remove this file?", "Are you sure you want to remove all files?", "Are you sure you want to remove these files?"]}
              removeButton
            />
          </FlexItem>
        </Flex>
      </FlexItem>

      <FlexItem>
        <Flex direction={{ default: 'column' }} rowGap={{ default: 'rowGapMd'}}>
          <FlexItem>
            <Content component='h2'>To process</Content>
          </FlexItem>
          <FlexItem>
            <Content component='p'>The following files were uploaded in a format other than Markdown and must be converted before being added to the workspace</Content>
          </FlexItem>

          <FlexItem>
            <Table<fileEntry> 
              columns={columns} 
              data={files.filter(file => file.type != 'text/markdown').map((file) => ({
                value: {
                  name: file.name,
                  type: fileTypeTranslations[file.type] || file.type,
                  size: file.size,
                },
                display: {
                  name: file.name,
                  type: fileTypeTranslations[file.type] || file.type,
                  size: sizeForDisplay(file.size)
                }
              }))}
              reconcileData={reconcileNonMarkdown}
              noContentText="No uploads of this type"
              removeTitles={["Remove file?", "Remove all?", "Remove selected files?"]}
              removeTexts={["Are you sure you want to remove this file?", "Are you sure you want to remove all files?", "Are you sure you want to remove these files?"]}
              removeButton
            />
          </FlexItem>
        </Flex>
      </FlexItem>

      <FlexItem>
        <Button isDisabled={!files.length} onClick={() => nextStage(files)}>Continue</Button>
      </FlexItem>
    </Flex>
  )
}

export default Stage1;