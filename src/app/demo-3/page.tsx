// src/app/demo-3/page.tsx

'use client';

import {
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
        <StageManager setConversionActive={setConversionActive} workspaceFiles={markdownFiles}/>
      ) : (
        <div style={{ display: "flex", width: "100%", padding: '3rem', justifyContent: 'center' }}>
          <Button onClick={handleStartConversion}>Start Demo</Button>
        </div>
      )}
    </>
  )
}

export default Page;