// src/components/Stage1/FileUpload.tsx




// Overwrite order flips, but doesn't impact functionality and can be fixed later

'use client';

import { useEffect, useState } from 'react';

import {
  MultipleFileUpload,
  MultipleFileUploadMain,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  Button,
  Content,
  Flex,
  FlexItem,
  type DropEvent
} from '@patternfly/react-core';
import UploadIcon from '@patternfly/react-icons/dist/esm/icons/upload-icon';

interface FileUploadProps {
  workspaceFiles: File[];
  uploadedFiles: File[];
  setUploadedFiles: React.Dispatch<React.SetStateAction<File[]>>;
}

const FileUpload: React.FunctionComponent<FileUploadProps> = ({ workspaceFiles, uploadedFiles, setUploadedFiles }) => {
  const [fromDrop, setFromDrop] = useState<File[]>([]);

  const [duplicateFiles, setDuplicateFiles] = useState<File[]>([]);
  const [showDuplicatesModal, setShowDuplicatesModal] = useState(false);

  const [filesToUpload, setFilesToUpload] = useState<File[]>([]);

  const truncateThreshold = 3; // Number of duplicate files to show before truncating the list

  const allowedFileTypes: { [mime: string]: string[] } = {
    'application/pdf': ['.pdf'],
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
    'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.svg'],
    'text/html': ['.html'],
    'text/asciidoc': ['.adoc'],
    'text/markdown': ['.md']
  };

  const getFileStem = (file: File): string => {
    return file.name.split('.').slice(0, -1).join('.');
  }

  const findDuplicateFiles = (files: File[]): File[] => {
    const fileStems = files.map(file => getFileStem(file));
    const isDuplicate = fileStems.map((stem, index) => fileStems.indexOf(stem) !== index);
    return findUniqueFiles(files.filter((file, index) => isDuplicate[index]));
  }

  const findUniqueFiles = (files: File[]): File[] => {
    const fileStems = files.map(file => getFileStem(file));
    const isUnique = fileStems.map((stem, index) => fileStems.indexOf(stem) === index);
    return files.filter((file, index) => isUnique[index]);
  }

  // callback that will be called by the react dropzone with the newly dropped file objects
  const handleFileDrop = (_event: DropEvent, droppedFiles: File[]) => {
    // identify files that have conflicting names
    const duplicates = findDuplicateFiles([...workspaceFiles, ...uploadedFiles, ...droppedFiles]);

    if (duplicates.length) {
      setFromDrop(droppedFiles);
      setDuplicateFiles(duplicates);
      setShowDuplicatesModal(true);
      return;
    }

    // identify what, if any, files are re-uploads of already uploaded files
    const currentFileNames = uploadedFiles.map((file) => file.name);
    const reUploads = droppedFiles.filter((droppedFile) => currentFileNames.includes(droppedFile.name));
    const newFiles = droppedFiles.filter((droppedFile) => !currentFileNames.includes(droppedFile.name));

    if (reUploads.length) {
      // Show the overwrite modal warning if there are files with reuploads
      setFilesToUpload(newFiles);
      setDuplicateFiles(reUploads);
      setShowDuplicatesModal(true);
      return;
    }

    updateCurrentFiles(newFiles);
  };

  const overwriteFiles = async () => {
    const toOverwrite = findUniqueFiles(duplicateFiles);
    const toUpload = fromDrop.filter(file => !toOverwrite.some(overwriteFile => getFileStem(overwriteFile) === getFileStem(file)));

    setDuplicateFiles([]);
    setFromDrop([]);
    setShowDuplicatesModal(false);

    /** this promise chain is needed because if the file removal is done at the same time as the file adding react
     * won't realize that the status items for the re-uploaded files needs to be re-rendered */
    Promise.resolve()
      .then(() => removeFiles(toOverwrite))
      .then(() => updateCurrentFiles([...toUpload, ...toOverwrite]));
  };

  const addSuffixes = () => {
    let allFiles = [...workspaceFiles, ...uploadedFiles];
    let dropped = [...fromDrop];

    for (let i = 0; i < fromDrop.length; i++) {
      const originalFile = fromDrop[i];
      let fileStem = getFileStem(originalFile);
      let nextSuffix = 1;
      const fileExtension = dropped[i].name.split('.').pop();

      while (allFiles.some(existingFile => getFileStem(existingFile) === fileStem)) {
        fileStem = `${getFileStem(originalFile)}-${nextSuffix}`;
        nextSuffix++;
      }

      const renamedFile = new File([originalFile], `${fileStem}.${fileExtension}`, { type: originalFile.type });
      dropped[i] = renamedFile
      allFiles.push(renamedFile);
    }

    updateCurrentFiles(dropped);
    setDuplicateFiles([]);
    setFromDrop([]);
    setShowDuplicatesModal(false);
  }

  const cancelUpload = () => {
    setDuplicateFiles([]);
    setFromDrop([]);
    setShowDuplicatesModal(false);
  }

  // remove files from the state array based on their stems
  const removeFiles = (filesToRemove: File[]) => {
    const newCurrentFiles = uploadedFiles.filter(
      (file) => !filesToRemove.some(fileToRemove => getFileStem(fileToRemove) === getFileStem(file))
    );

    setUploadedFiles(newCurrentFiles);
  };

  const updateCurrentFiles = (files: File[]) => {
    setUploadedFiles((prevFiles) => [...prevFiles, ...files]);
  };

  const getDuplicateWarningText = () => {
    if (duplicateFiles.length > 1) {
      return (
        <>
          <Content component="p">The following file names are already in use in your workspace:</Content>
          {duplicateFiles.length > truncateThreshold ? (
            <>
              <Content component="ul">
                {duplicateFiles.slice(0, truncateThreshold - 1).map((file) => (
                  <Content component="li" key={file.name}>{getFileStem(file)}</Content>
                ))}
                <Content component="li" key={duplicateFiles[truncateThreshold - 1].name}>
                  {getFileStem(duplicateFiles[truncateThreshold - 1])} (+{duplicateFiles.length - truncateThreshold} more)
                </Content>
              </Content>
            </>
          ) : (
            <Content component="ul">
              {duplicateFiles.map((file) => (
                <Content component="li" key={file.name}>{getFileStem(file)}</Content>
              ))}
            </Content>
          )}
          <Content component="p">Please choose how to proceed. Automatically adding suffixes ({getFileStem(duplicateFiles[0])}-1) is recommended and will keep both the old and new files</Content>
        </>
      );
    }

    return (
      <Content component="p">
        The file name <strong>{getFileStem(duplicateFiles[0])}</strong> is already in use in your workspace. Please choose how to proceed. Automatically adding suffixes ({getFileStem(duplicateFiles[0])}-1) is recommended and will keep both the old and new files
      </Content>
    );
  };

  return (
    <>
      <MultipleFileUpload
        onFileDrop={handleFileDrop}
        dropzoneProps={{
          accept: allowedFileTypes
        }}
      >
        <MultipleFileUploadMain
          titleIcon={<UploadIcon />}
          titleText="Drag and drop files here"
          titleTextSeparator="or"
          infoText="Accepted file types: Markdown, AsciiDoc, Images (PNG, JPEG, WEBP), PDF, DOCX, XLSX, PPTX, HTML"
        />
      </MultipleFileUpload>

      {showDuplicatesModal && (
        <Modal
          isOpen
          disableFocusTrap
          variant="medium"
          aria-label="duplicate file names warning"
          aria-labelledby="duplicate-file-names-warning-title"
          aria-describedby="duplicate-file-names-warning-variant"
        >
          <ModalHeader title="Duplicate File Names" labelId="duplicate-file-names-title" titleIconVariant="warning" />
          <ModalBody id="duplicate-file-names-variant">{getDuplicateWarningText()}</ModalBody>
          <ModalFooter>
            <Flex style={{ width: "100%" }} justifyContent={{ default: 'justifyContentSpaceBetween' }}>
              <FlexItem>
                <Button key="overwrite" variant="secondary" onClick={cancelUpload}>
                  Cancel
                </Button>
              </FlexItem>

              <FlexItem>
                <Flex gap={{ default: 'gapSm'}}>
                  <FlexItem>
                    <Button key="overwrite" variant="danger" onClick={overwriteFiles}>
                      Overwrite
                    </Button>
                  </FlexItem>
                  <FlexItem>
                    <Button key="add-suffixes" variant="primary" onClick={addSuffixes}>
                      Add suffixes
                    </Button>
                  </FlexItem>
                </Flex>
              </FlexItem>
            </Flex>
          </ModalFooter>
        </Modal>
      )}
    </>
  );
};

export default FileUpload;