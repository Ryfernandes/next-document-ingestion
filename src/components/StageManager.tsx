// src/components/StageManager.tsx

'use client';

import { 
  Content,
  Flex,
  FlexItem
} from '@patternfly/react-core';

import { useState } from 'react';

import Stage1 from './Stage1';
import FileDisplay from './FileDisplay';

interface StageManagerProps {
  workspaceFiles: File[];
  setConversionActive?: (active: boolean) => void;
}

const StageManager: React.FunctionComponent<StageManagerProps> = ({ workspaceFiles, setConversionActive }) => {
  const [stage, setStage] = useState(1);
  const [finishedFiles, setFinishedFiles] = useState<File[]>([]);
  const [toConvert, setToConvert] = useState<File[]>([]);

  const changeStage = (files?: File[]) => {
    if (stage === 1 && files) {
      const markdown = files.filter(file => file.type === 'text/markdown');
      const nonMarkdown = files.filter(file => file.type !== 'text/markdown');

      setFinishedFiles(markdown);
      setToConvert(nonMarkdown);

      alert(`${markdown.length} markdown files uploaded to workspace. ${nonMarkdown.length} non-markdown files sent to conversion stage (to be implemented). Returning to demo start screen.`);

      if (setConversionActive) {
        setConversionActive(false);
      }
    }

    setStage(prev => prev + 1)
  }

  return (
    <>
      <Flex style={{ width: '100%', height: '100%', backgroundColor: '#f0f0f0', padding: '3rem', overflow: 'scroll', justifyContent: 'center'}}>
        {stage === 1 && (
          <FlexItem style={{ width: '100%', maxWidth: '1800px' }}>
            <Stage1 workspaceFiles={workspaceFiles} nextStage={changeStage}/>
          </FlexItem>
        )}
      </Flex>
    </>
  );
}

export default StageManager;