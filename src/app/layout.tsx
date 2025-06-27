// src/app/layout.tsx

import { ReactNode } from 'react';
import '@patternfly/react-core/dist/styles/base.css';

export const metadata = {
  title: 'Document Ingestion Demo',
  description: 'A modular interface wrapping Docling-Serve to simplify document ingestion for your AI applications'
}

interface RootLayoutProps {
  children: ReactNode;
}

const RootLayout = ({ children }: RootLayoutProps) => {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
};

export default RootLayout;