import { ReactNode } from 'react';
import '@patternfly/react-core/dist/styles/base.css';

export const metadata = {
  title: 'InstructLab Document Ingestion',
  description: 'Updated user interface for document ingestion and conversion in InstructLab'
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