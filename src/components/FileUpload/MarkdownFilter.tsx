// src/components/FileUpload/MarkdownFilter.tsx

'use client';

import {
  Button,
  Content,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Checkbox
} from '@patternfly/react-core';

import { useState } from 'react';
import { convertFilesToMarkdown } from './fileConversionUtils';

interface MarkdownFilterProps {
  input: File[];
  converted: File[];
  unconverted: File[];
  resetInput: () => void;
  setConverted: React.Dispatch<React.SetStateAction<File[]>>;
  setUnconverted: React.Dispatch<React.SetStateAction<File[]>>;
}

const MarkdownFilter: React.FunctionComponent<MarkdownFilterProps> = ({ input, converted, unconverted, resetInput, setConverted, setUnconverted }) => {
  const [showConversionModal, setShowConversionModal] = useState(false);
  const [working, setWorking] = useState(false);
  const [converting, setConverting] = useState(false);
  const [conversionOptions, setConversionOptions] = useState<File[]>([]);
  const [filesToConvert, setFilesToConvert] = useState<{ [key: string]: boolean }>({});
  
  const handleFilter = () => {
    setWorking(true);

    const markdownFiles: File[] = input.filter(file => file.type === 'text/markdown');
    const filesToConvert: File[] = input.filter(file => file.type !== 'text/markdown');

    resetInput();
    setConverted(prev => [...prev, ...markdownFiles]);

    if (filesToConvert.length) {
      setConversionOptions(filesToConvert);
      setShowConversionModal(true);
      return;
    }

    setWorking(false);
  }

  const handleCheckboxChange = (event: React.FormEvent<HTMLInputElement>, checked: boolean) => {
    const target = event.currentTarget;
    const name = target.name;

    setFilesToConvert(prev => ({...prev, [name]: checked }));
  };

  const addCheckboxDefault = (fileName: string) => {
    setFilesToConvert(prev => ({ ...prev, [fileName]: true }));

    return true;
  }

  const getMarkdownConversionContent = () => {
    if (conversionOptions.length > 1) {
      return (
        <>
          <Content component="p">The following files must be converted to Markdown:</Content>
          <Content component="ul">
            {conversionOptions.map((file) => (
              <Checkbox
                isChecked={filesToConvert[file.name] ?? addCheckboxDefault(file.name)}
                onChange={handleCheckboxChange}
                key={file.name}
                label={file.name}
                isLabelWrapped
                id={file.name}
                name={file.name}
              />
            ))}
          </Content>
          <Content component="p">Any files that you do not convert will be saved in their original state to convert later</Content>
        </>
      );
    }

    return (
      <Content component="p">
        A file with the name <b>{conversionOptions[0].name}</b> must be converted to Markdown. The conversion can be deferred to a later time, and the document will be stored in its original form
      </Content>
    );
  };

  const convertToMarkdown = async () => {
    // If the checkboxes were not presented in the display, add the sole option to the conversion list
    setConverting(true);

    let toConvert: File[] = [];
    let toLeave: File[] = [];

    if (conversionOptions.length == 1) {
      toConvert = [...conversionOptions];
    } else {
      toConvert = conversionOptions.filter(file => filesToConvert[file.name]);
      toLeave = conversionOptions.filter(file => !filesToConvert[file.name]);
    }

    setUnconverted(prev => [...prev, ...toLeave]);

    await convertFilesToMarkdown(toConvert, () => false, (message: string) => {alert(message)}).then(convertedFiles => {
      setConverted(prev => [...prev, ...convertedFiles]);
      setShowConversionModal(false);
      setWorking(false);
    });

    setConverting(false);
  }

  const deferConversion = () => {
    setUnconverted(prev => [...prev, ...conversionOptions]);

    setShowConversionModal(false);
    setWorking(false);
  }

  return (
    <>
      <Button
        variant="primary"
        onClick={handleFilter}
        isDisabled={!input.length || working}
      >
        Filter Markdown Files
      </Button>

      {showConversionModal && (
        <Modal
          isOpen
          variant="medium"
          aria-label="markdown conversion prompt"
          aria-labelledby="markdown-conversion-prompt-title"
          aria-describedby="markdown-conversion-prompt-variant"
        >
          <ModalHeader title="Convert files to Markdown?" labelId="markdown-conversion-prompt-title" titleIconVariant="info" />
          <ModalBody id="markdown-conversion-prompt-variant">{getMarkdownConversionContent()}</ModalBody>
          <ModalFooter>
            <Button 
              key="convert" 
              variant="primary" 
              onClick={convertToMarkdown}
              isLoading={converting}
              isDisabled={converting}
              spinnerAriaValueText="Converting documents..."
            >
              Convert now with Docling
            </Button>
            <Button key="cancel" variant="secondary" onClick={deferConversion}>
              Convert later
            </Button>
          </ModalFooter>
        </Modal>
      )}
    </>
  )
}

export default MarkdownFilter;