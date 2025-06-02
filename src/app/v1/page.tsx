// src/app/v1/page.tsx

'use client';

import Documents from '@/components/FileUpload/Documents';
import { 
  Stack, 
  StackItem 
} from '@patternfly/react-core';
import { useState } from 'react';

const Page = () => {
  const [documents, setDocuments] = useState<File[]>([]);

  return (
    <div style={{ padding: '3rem'}}>
      <Documents/>
    </div>
  )
}

export default Page;