// src/components/Stage1/index.tsx

'use client';

import {
  Button,
  Content,
  Flex,
  FlexItem
} from '@patternfly/react-core';

import { useState } from 'react';

import FileUpload from '@/components/Stage1/FileUpload';
import Table from '@/components/Table';
import type { Column } from '@/components/Table';

interface Stage1Props {
  workspaceFiles: File[];
}

type fileEntry = {
  name: string;
  type: string;
  size: string;
};

const Stage1: React.FunctionComponent<Stage1Props> = ({ workspaceFiles }) => {

  const [files, setFiles] = useState<File[]>([]);

  const columns: Column<fileEntry>[] = [
    { header: "Name", accessor: "name", type: "expands" },
    { header: "Type", accessor: "type", type: "md" },
    { header: "Size", accessor: "size", type: "sm" }
  ];

  const data: fileEntry[] = [
    { name: "03_BofA_InterestChecking_en_ADA", type: "Markdown", size: "36KB" },
    { name: "04_Rewards_Money_Market_Savings", type: "Markdown", size: "18KB" },
    { name: "03_BofA_InterestChecking_en_ADA", type: "Markdown", size: "36KB" },
    { name: "04_Rewards_Money_Market_Savings", type: "Markdown", size: "18KB" },
    { name: "03_BofA_InterestChecking_en_ADA", type: "Markdown", size: "36KB" },
    { name: "04_Rewards_Money_Market_Savings", type: "Markdown", size: "18KB" },
    { name: "03_BofA_InterestChecking_en_ADA", type: "Markdown", size: "36KB" },
    { name: "04_Rewards_Money_Market_Savings", type: "Markdown", size: "18KB" },
    { name: "03_BofA_InterestChecking_en_ADA", type: "Markdown", size: "36KB" },
    { name: "04_Rewards_Money_Market_Savings", type: "Markdown", size: "18KB" }
  ]

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
            <Table<fileEntry> columns={columns} data={data}/>
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
        </Flex>
      </FlexItem>
    </Flex>
  )
}

export default Stage1;