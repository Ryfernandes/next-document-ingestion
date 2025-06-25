// src/components/FeedbackComponents/IngestionManager.tsx

'use client';

import { 
  Content,
  Flex,
  FlexItem,
  Breadcrumb,
  BreadcrumbItem,
} from '@patternfly/react-core';

import { useState, useRef } from 'react';

import ConversionStep from './ConversionStep';

type IngestionManagerProps = {
  localPort: string;
  returnPort: (port: string) => void;
}

const IngestionManager: React.FunctionComponent<IngestionManagerProps> = ({ localPort, returnPort }) => {
  const [page, setPage] = useState(1);

  return (
    <>
      <Flex style={{ width: '100%', backgroundColor: '#ffffff', padding: '2rem', overflow: 'scroll', flexDirection: 'column', gap: '1rem' }}>
        { page == 1 && (
          <ConversionStep localPort={localPort} returnPort={returnPort} />
        )}
      </Flex>
    </>
  );
}

export default IngestionManager;