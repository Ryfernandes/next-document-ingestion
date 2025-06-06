// src/components/StageManager.tsx

'use client';

import { 
  Content,
  Flex,
  FlexItem
} from '@patternfly/react-core';

import { useState, useRef } from 'react';

import Stage1 from './Stage1';
import Stage2 from './Stage2';
import type { fullConversionPackage } from './Stage2';

interface StageManagerProps {
  workspaceFiles: File[];
  setConversionActive?: (active: boolean) => void;
  startStage?: number;
}

const StageManager: React.FunctionComponent<StageManagerProps> = ({ workspaceFiles, setConversionActive, startStage }) => {
  const [stage, setStage] = useState(startStage || 1);
  const [finishedFiles, setFinishedFiles] = useState<File[]>([]);
  const [toConvert, setToConvert] = useState<File[]>([]);
  const [conversionPackages, setConversionPackages] = useState<fullConversionPackage[]>([]);

  const pageRef = useRef<HTMLDivElement>(null);

  const changeStage = (files?: File[], packages?: fullConversionPackage[]) => {
    if (stage === 1 && files) {
      const markdown = files.filter(file => file.type === 'text/markdown');
      const nonMarkdown = files.filter(file => file.type !== 'text/markdown');

      setFinishedFiles(markdown);
      setToConvert(nonMarkdown);
    }

    if (stage === 2 && packages) {
      setConversionPackages(packages);
      alert(`${packages.length} files packaged with conversion settings sent for conversion.`);
      if (setConversionActive) {
        setConversionActive(false);
      }
    }

    setStage(prev => prev + 1);
    pageRef.current?.scrollTo({ top: 0 });
  }

  const goBack = () => {
    pageRef.current?.scrollTo({ top: 0 });
    setStage(prev => Math.max(prev - 1, 1));
  }

  const toStage3 = (packages: fullConversionPackage[]) => {
    changeStage([], packages);
  }

  return (
    <>
      <Flex ref={pageRef} style={{ width: '100%', height: '100%', backgroundColor: '#f0f0f0', padding: '3rem', overflow: 'scroll', justifyContent: 'center'}}>
        {stage === 1 && (
          <FlexItem style={{ width: '100%', maxWidth: '1800px' }}>
            <Stage1 uploadedFiles={toConvert} workspaceFiles={workspaceFiles} nextStage={changeStage}/>
          </FlexItem>
        )}
        {stage == 2 && (
          <FlexItem style={{ width: '100%', maxWidth: '1800px' }}>
            <Stage2 toConvert={toConvert} nextStage={toStage3} previousStage={goBack}/>
          </FlexItem>
        )}
      </Flex>
    </>
  );
}

export default StageManager;