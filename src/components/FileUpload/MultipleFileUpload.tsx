// src/components/FileUpload/MultipleFileUpload.tsx

'use client';

import { useEffect, useState } from 'react';
import {
  MultipleFileUpload,
  MultipleFileUploadMain,
  MultipleFileUploadStatus,
  MultipleFileUploadStatusItem,
  Checkbox,
  HelperText,
  HelperTextItem,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  Button,
  Content,
  type DropEvent
} from '@patternfly/react-core';
import UploadIcon from '@patternfly/react-icons/dist/esm/icons/upload-icon';

interface readFile {
  fileName: string;
  data?: string;
  loadResult?: 'danger' | 'success';
  loadError?: DOMException;
}

interface MultipleFileUploadBasicProps {
  output: File[];
  readOutput: readFile[];
  setOutput: React.Dispatch<React.SetStateAction<File[]>>;
  setReadOutput: React.Dispatch<React.SetStateAction<readFile[]>>;
}

const MultipleFileUploadBasic: React.FunctionComponent<MultipleFileUploadBasicProps> = ({ output, readOutput, setOutput, setReadOutput }) => {
  const [showStatus, setShowStatus] = useState(false);
  const [statusIcon, setStatusIcon] = useState('inProgress');
  const [showOverwriteModal, setShowOverwriteModal] = useState(false);
  const [filesToUpload, setFilesToUpload] = useState<File[]>([]);

  const [overwriteOptions, setOverwriteOptions] = useState<File[]>([]);
  const [filesToOverwrite, setFilesToOverwrite] = useState<{ [key: string]: boolean }>({});

  const conversionEnabled = true; // Indicator if Docling conversion is enabled and non-md files can be uploaded

  const isHorizontal = false; // Set to change layout of file upload component
  const fileUploadShouldFail = false; // Set to demonstrate error reporting by forcing uploads to fail

  const showFilePreview = false; // Set to show iFrame of uploaded files

  const allowedFileTypes: { [mime: string]: string[] } = conversionEnabled
  ? {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.svg'],
      'text/html': ['.html'],
      'text/asciidoc': ['.adoc'],
      'text/markdown': ['.md']
    }
  : { 'text/markdown': ['.md'] };

  // only show the status component once a file has been uploaded, but keep the status list component itself even if all files are removed
  if (!showStatus && output.length > 0) {
    setShowStatus(true);
  }

  // determine the icon that should be shown for the overall status list
  useEffect(() => {
    if (readOutput.length < output.length) {
      setStatusIcon('inProgress');
    } else if (readOutput.every((file) => file.loadResult === 'success')) {
      setStatusIcon('success');
    } else {
      setStatusIcon('danger');
    }
  }, [readOutput, output]);
  
  useEffect(() => {
    
  }, [output]);

  // remove files from both state arrays based on their name
  const removeFiles = (namesOfFilesToRemove: string[]) => {
    const newCurrentFiles = output.filter(
      (file) => !namesOfFilesToRemove.some((fileName) => fileName === file.name)
    );

    setOutput(newCurrentFiles);

    const newReadFiles = readOutput.filter(
      (readFile) => !namesOfFilesToRemove.some((fileName) => fileName === readFile.fileName)
    );

    setReadOutput(newReadFiles);
  };

  /** Forces uploaded files to become corrupted if "Demonstrate error reporting by forcing uploads to fail" is selected in the example,
   * only used in this example for demonstration purposes */
  const updateCurrentFiles = (files: File[]) => {
    if (fileUploadShouldFail) {
      const corruptedFiles = files.map((file) => ({ ...file, lastModified: 'foo' as unknown as number }));

      setOutput((prevFiles) => [...prevFiles, ...(corruptedFiles as any)]);
    } else {
      setOutput((prevFiles) => [...prevFiles, ...files]);
    }
  };

  // callback that will be called by the react dropzone with the newly dropped file objects
  const handleFileDrop = (_event: DropEvent, droppedFiles: File[]) => {
    // identify what, if any, files are re-uploads of already uploaded files
    const currentFileNames = output.map((file) => file.name);
    const reUploads = droppedFiles.filter((droppedFile) => currentFileNames.includes(droppedFile.name));
    const newFiles = droppedFiles.filter((droppedFile) => !currentFileNames.includes(droppedFile.name));

    if (reUploads.length) {
      // Show the overwrite modal warning if there are files with reuploads
      setFilesToUpload(newFiles);
      setOverwriteOptions(reUploads);
      setShowOverwriteModal(true);
      return;
    }

    updateCurrentFiles(newFiles);
  };

  // callback called by the status item when a file is successfully read with the built-in file reader
  const handleReadSuccess = (data: string, file: File) => {
    setReadOutput((readFiles) => {
      const filteredReadFiles = readFiles.filter((readFile) => file.name !== readFile.fileName);
      return [...filteredReadFiles, { data, fileName: file.name, loadResult: 'success' }]});
  };

  // callback called by the status item when a file encounters an error while being read with the built-in file reader
  const handleReadFail = (error: DOMException, file: File) => {
    setReadOutput((prevReadFiles) => [
      ...prevReadFiles,
      { loadError: error, fileName: file.name, loadResult: 'danger' }
    ]);
  };

  // add helper text to a status item showing any error encountered during the file reading process
  const createHelperText = (file: File) => {
    const fileResult = readOutput.find((readFile) => readFile.fileName === file.name);
    if (fileResult?.loadError) {
      return (
        <HelperText isLiveRegion>
          <HelperTextItem variant="error">{fileResult.loadError.toString()}</HelperTextItem>
        </HelperText>
      );
    }
  };

  const handleCheckboxChange = (event: React.FormEvent<HTMLInputElement>, checked: boolean) => {
    const target = event.currentTarget;
    const name = target.name;

    setFilesToOverwrite(prev => ({...prev, [name]: checked }));
  };

  const addCheckboxDefault = (fileName: string) => {
    setFilesToOverwrite(prev => ({ ...prev, [fileName]: true }));

    return true;
  }

  const getOverwriteWarningText = () => {
    if (overwriteOptions.length > 1) {
      return (
        <>
          <Content component="p">The following files have already been uploaded:</Content>
          <Content component="ul">
            {overwriteOptions.map((file) => (
              <Checkbox
                isChecked={filesToOverwrite[file.name] ?? addCheckboxDefault(file.name)}
                onChange={handleCheckboxChange}
                key={file.name}
                label={file.name}
                isLabelWrapped
                id={file.name}
                name={file.name}
              />
            ))}
          </Content>
          <Content component="p">Uploading the new files will overwrite the existing files.</Content>
        </>
      );
    }

    return (
      <Content component="p">
        A file with the name <b>{overwriteOptions[0].name}</b> has already been uploaded. Uploading the new file will overwrite the existing one.
      </Content>
    );
  };

  const overwriteFiles = async () => {
    const willUpload = filesToUpload;
    const willOverwrite = overwriteOptions.filter(file => filesToOverwrite[file.name]);

    // If the checkboxes were not presented in the display, add the sole option to the overwrite list
    if (overwriteOptions.length == 1) {
      willOverwrite.push(overwriteOptions[0]);
    }

    setFilesToOverwrite({}); // Reset the files to overwrite state
    setOverwriteOptions([]); // Reset the overwrite options

    /*if (remoteUploadFile) {
      await doUploadFiles([remoteUploadFile]);
      setRemoteUploadFile(undefined);
      return;
    }

    await doConvertFiles(droppedFiles);
    setDroppedFiles([]);*/

    setShowOverwriteModal(false);
    

    /** this promise chain is needed because if the file removal is done at the same time as the file adding react
     * won't realize that the status items for the re-uploaded files needs to be re-rendered */
    Promise.resolve()
      .then(() => removeFiles(willOverwrite.map((file) => file.name)))
      .then(() => updateCurrentFiles([...willUpload, ...willOverwrite]));
  };

  const cancelOverwrite = () => {
    const willUpload = filesToUpload;

    setFilesToUpload([]); // Reset the files to upload state
    setFilesToOverwrite({}); // Reset the files to overwrite state
    setOverwriteOptions([]); // Reset the overwrite options
    //setDroppedFiles([]);

    setShowOverwriteModal(false);

    updateCurrentFiles(willUpload);
  };

  const successfullyReadFileCount = readOutput.filter((fileData) => fileData.loadResult === 'success').length;

  return (
    <>
      <MultipleFileUpload
        onFileDrop={handleFileDrop}
        dropzoneProps={{
          accept: allowedFileTypes
        }}
        isHorizontal={isHorizontal}
      >
        <MultipleFileUploadMain
          titleIcon={<UploadIcon />}
          titleText="Drag and drop files here"
          titleTextSeparator="or"
          infoText="Accepted file types: Markdown, AsciiDoc, Images (PNG, JPEG, WEBP), PDF, DOCX, XLSX, PPTX, HTML"
        />
        {showStatus && (
          <MultipleFileUploadStatus
            statusToggleText={`${successfullyReadFileCount} of ${output.length} files uploaded`}
            statusToggleIcon={statusIcon}
            aria-label="Current uploads"
          >
            {output.map((file) => (
              <MultipleFileUploadStatusItem
                file={file}
                key={file.name}
                onClearClick={() => removeFiles([file.name])}
                onReadSuccess={handleReadSuccess}
                onReadFail={handleReadFail}
                progressHelperText={createHelperText(file)}
              />
            ))}
          </MultipleFileUploadStatus>
        )}
      </MultipleFileUpload>

      {showOverwriteModal ? (
        <Modal
          isOpen
          variant="small"
          aria-label="file overwrite warning"
          aria-labelledby="file-overwrite-warning-title"
          aria-describedby="file-overwrite-warning-variant"
        >
          <ModalHeader title="Overwrite file?" labelId="file-overwrite-warning-title" titleIconVariant="warning" />
          <ModalBody id="file-overwrite-warning-variant">{getOverwriteWarningText()}</ModalBody>
          <ModalFooter>
            <Button key="overwrite" variant="primary" onClick={overwriteFiles}>
              Overwrite
            </Button>
            <Button key="cancel" variant="secondary" onClick={cancelOverwrite}>
              Keep existing files
            </Button>
          </ModalFooter>
        </Modal>
      ) : null}

      {showFilePreview && readOutput.map((readFile) => {
        return (
          <iframe src={readFile.data} key={readFile.fileName} title="IFrame Preview" style={{ width: '100%', height: '800px' }} />
        )
      })}
    </>
  );
};

export default MultipleFileUploadBasic;