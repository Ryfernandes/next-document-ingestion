// src/components/StageManager.tsx

'use client';

import { 
  Content,
  Flex,
  FlexItem
} from '@patternfly/react-core';

import { useState } from 'react';

import Stage1 from './Stage1';

interface StageManagerProps {
  workspaceFiles: File[];
}

const StageManager: React.FunctionComponent<StageManagerProps> = ({ workspaceFiles }) => {
  const [stage, setStage] = useState(1);

  return (
    <>
      <Flex style={{ width: '100%', height: '100%', backgroundColor: '#f0f0f0', padding: '3rem', overflow: 'scroll'}}>
        {stage === 1 && (
          <FlexItem style={{ width: '100%' }}>
            <Stage1 workspaceFiles={workspaceFiles}/>
          </FlexItem>
        )}
      </Flex>
    </>
  );
}

export default StageManager;