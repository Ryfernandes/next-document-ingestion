// src/app/feedback-implementation/page.tsx

'use client';

import {
  Button
} from '@patternfly/react-core';

import IngestionManager from '@/components/FeedbackComponents/IngestionManager';

const Page = () => {

  return (
    <>
      <IngestionManager />
    </>
  )
}

export default Page;