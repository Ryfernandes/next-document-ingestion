// src/components/FileUpload/Documents.tsx

'use client';

import {
  Content
} from '@patternfly/react-core';

import MultipleFileUploadBasic from "@/components/FileUpload/MultipleFileUpload";
import MarkdownFilter from "@/components/FileUpload/MarkdownFilter";
import { useEffect, useState } from "react";

interface readFile {
  fileName: string;
  data?: string;
  loadResult?: 'danger' | 'success';
  loadError?: DOMException;
}

const Documents: React.FunctionComponent = () => {
  const [readDocuments, setReadDocuments] = useState<readFile[]>([]);
  const [uploadedDocuments, setUploadedDocuments] = useState<File[]>([]);
  const [markdownFiles, setMarkdownFiles] = useState<File[]>([]);
  const [unconvertedFiles, setUnconvertedFiles] = useState<File[]>([]);
  
  const resetStepOne = () => {
    setReadDocuments([]);
    setUploadedDocuments([]);
  }

  return (
    <>
      <Content component='h2' style={{ marginBottom: "1rem" }}>Step 1. Upload Documents</Content>
      <MultipleFileUploadBasic 
        output={uploadedDocuments} 
        readOutput={readDocuments}
        setOutput={setUploadedDocuments}
        setReadOutput={setReadDocuments}
      />
      <Content component='h2' style={{ marginBottom: "1rem" }}>Step 2. Filter Documents</Content>
      <MarkdownFilter
        input={uploadedDocuments}
        converted={markdownFiles}
        unconverted={unconvertedFiles}
        resetInput={resetStepOne}
        setConverted={setMarkdownFiles}
        setUnconverted={setUnconvertedFiles}
      />
      <Content component='h2' style={{ marginBottom: "1rem" }}>Result: Markdown Documents for ILab & RAG</Content>
      {markdownFiles.map(file => (
        <div>
          <Content key={file.name} component='a' href={URL.createObjectURL(file)} target='_blank'> 
            {file.name}
          </Content>
        </div>
      ))}
    </>
  )
}

export default Documents;