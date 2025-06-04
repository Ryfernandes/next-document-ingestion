// src/app/v3/page.tsx

'use client';

import { 
  Stack, 
  StackItem,
  Button
} from '@patternfly/react-core';

import { useState } from 'react';

import FileDisplay from '@/components/FileDisplay';
import StageManager from '@/components/StageManager';

const Page = () => {
  const [markdownFiles, setMarkdownFiles] = useState<File[]>([]);
  const [conversionActive, setConversionActive] = useState(false);

  const handleStartConversion = () => {
    setConversionActive(true);
  }

  return (
    <>
      {conversionActive ? (
        <StageManager setConversionActive={setConversionActive} startStage={2} workspaceFiles={markdownFiles}/>
      ) : (
        <div style={{ padding: '3rem' }}>
          <Button onClick={handleStartConversion}>Add Markdown Files</Button>
          <FileDisplay files={markdownFiles} />
        </div>
      )}
    </>
  )
}

export default Page;