'use client';

import MultipleFileUploadBasic from '@/components/FileUpload/MultipleFileUpload';
import{ Stack, StackItem } from '@patternfly/react-core';

const Page = () => {
  return (
    <Stack hasGutter>
      <StackItem>
        Step 1: Document Upload
      </StackItem>
      <StackItem>
        <MultipleFileUploadBasic/>
      </StackItem>
    </Stack>
  )
}

export default Page;