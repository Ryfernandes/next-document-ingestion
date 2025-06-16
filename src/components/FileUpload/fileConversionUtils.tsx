// src/components/FileUpload/fileConversionUtils.tsx

import { conversionProfile } from "@/utils/conversionProfiles";
import { pipeline } from "stream";

type conversionPackage = {
  file: File;
  profile: conversionProfile;
}

// Helper function to convert ArrayBuffer to Base64
const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
};

const convertToMarkdown = async (file: File): Promise<BlobPart[]> => {
  // 1) Read file as ArrayBuffer
  const arrayBuffer = await new Promise<ArrayBuffer>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (result instanceof ArrayBuffer) {
        resolve(result);
      } else {
        reject(new Error('Unexpected result type when reading file as ArrayBuffer.'));
      }
    };
    reader.onerror = () => {
      reject(new Error('File reading failed.'));
    };
    reader.readAsArrayBuffer(file);
  });

  // 2) Attempt conversion call
  const res = await fetch('/api/convert', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      options: {
        from_formats: ['docx', 'pptx', 'html', 'image', 'pdf', 'asciidoc', 'md', 'xlsx'],
        to_formats: ['md'],
        image_export_mode: 'placeholder',
        table_mode: 'fast',
        abort_on_error: false,
        return_as_file: false,
        do_table_structure: true,
        include_images: false
      },
      file_sources: [
        {
          base64_string: arrayBufferToBase64(arrayBuffer),
          filename: file.name
        }
      ]
    })
  });

  if (!res.ok) {
    // Check if it's a 503 => offline service
    if (res.status === 503) {
      console.error('Conversion service offline, only .md files accepted');
      throw new Error('The file conversion service is offline. Only Markdown file type can be accepted until service is restored.');
    }
    console.error(`Conversion service responded with status ${res.status}`);
    throw new Error(`Could not convert file: ${file.name}. Service error: ${res.statusText}`);
  }

  // 3) We expect JSON-wrapped markdown => { content: "..." }
  const data = await res.json();
  return [data.content.document.md_content];
};

const convertToMarkdownIfNeeded = async (file: File): Promise<File> => {
  // If user picked a .md file, no need to call the conversion route
  if (file.name.toLowerCase().endsWith('.md')) {
    return file;
  }

  try {
    const blobParts = await convertToMarkdown(file);

    // Create a new `.md` File object
    const newName = file.name.replace(/\.[^/.]+$/, '') + '.md';
    const mdBlob = new Blob(blobParts, { type: 'text/markdown' });
    return new File([mdBlob], newName, { type: 'text/markdown' });
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error('Conversion error:', error);
      // If conversion fails, we let the UI know
      throw error;
    }
    console.error('Unknown conversion error:', error);
    throw new Error('An unknown error occurred during file conversion.');
  }
};

export const convertFilesToMarkdown = async (
  filesToConvert: File[],
  wasCanceled: () => boolean,
  onError: (message: string) => void
): Promise<File[]> => {
  const newFiles: File[] = [];

  // Convert files to .md if needed
  for (const f of filesToConvert) {
    if (!wasCanceled()) {
      try {
        const convertedFile = await convertToMarkdownIfNeeded(f);
        newFiles.push(convertedFile);
      } catch (err) {
        if (err instanceof Error) {
          console.error('File conversion failed for:', f.name, err);
          onError(`Could not convert file: ${f.name}. ${err.message}`);
        } else {
          console.error('File conversion failed for:', f.name, err);
          onError(`Could not convert file: ${f.name}. An unknown error occurred.`);
        }
      }
    }
  }

  // Update states
  return newFiles;
};

const convertToMarkdownWithOptions = async (filePackage: conversionPackage): Promise<BlobPart[]> => {
  // 1) Read file as ArrayBuffer
  const arrayBuffer = await new Promise<ArrayBuffer>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (result instanceof ArrayBuffer) {
        resolve(result);
      } else {
        reject(new Error('Unexpected result type when reading file as ArrayBuffer.'));
      }
    };
    reader.onerror = () => {
      reject(new Error('File reading failed.'));
    };
    reader.readAsArrayBuffer(filePackage.file);
  });

  // 2) Attempt conversion call
  const res = await fetch('/api/convert', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      options: {
        from_formats: ['docx', 'pptx', 'html', 'image', 'pdf', 'asciidoc', 'md', 'xlsx'],
        to_formats: ['md'],
        image_export_mode: filePackage.profile.image_export_mode,
        table_mode: filePackage.profile.table_mode,
        abort_on_error: false,
        return_as_file: false,
        pipeline: filePackage.profile.pipeline,
        ocr_engine: filePackage.profile.ocr_engine,
        pdf_backend: filePackage.profile.pdf_backend,
        do_ocr: filePackage.profile.do_ocr,
        force_ocr: filePackage.profile.force_ocr,
        do_code_enrichment: filePackage.profile.do_code_enrichment,
        do_formula_enrichment: filePackage.profile.do_formula_enrichment,
        do_picture_classification: filePackage.profile.do_picture_classification,
        do_picture_description: filePackage.profile.do_picture_description,
        do_table_structure: filePackage.profile.do_table_structure,
        md_page_break_placeholder: filePackage.profile.md_page_break_placeholder,
        include_images: false
      },
      file_sources: [
        {
          base64_string: arrayBufferToBase64(arrayBuffer),
          filename: filePackage.file.name
        }
      ]
    })
  });

  if (!res.ok) {
    // Check if it's a 503 => offline service
    if (res.status === 503) {
      console.error('Conversion service offline, only .md files accepted');
      throw new Error('The file conversion service is offline. Only Markdown file type can be accepted until service is restored.');
    }
    console.error(`Conversion service responded with status ${res.status}`);
    throw new Error(`Could not convert file: ${filePackage.file.name}. Service error: ${res.statusText}`);
  }

  // 3) We expect JSON-wrapped markdown => { content: "..." }
  const data = await res.json();
  return [data.content.document.md_content];
};

// Function variations with options included

const convertToMarkdownWithOptionsIfNeeded = async (filePackage: conversionPackage): Promise<File> => {
  // If user picked a .md file, no need to call the conversion route
  if (filePackage.file.name.toLowerCase().endsWith('.md')) {
    return filePackage.file;
  }

  try {
    const blobParts = await convertToMarkdownWithOptions(filePackage);

    // Create a new `.md` File object
    const newName = filePackage.file.name.replace(/\.[^/.]+$/, '') + '.md';
    const mdBlob = new Blob(blobParts, { type: 'text/markdown' });
    return new File([mdBlob], newName, { type: 'text/markdown' });
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error('Conversion error:', error);
      // If conversion fails, we let the UI know
      throw error;
    }
    console.error('Unknown conversion error:', error);
    throw new Error('An unknown error occurred during file conversion.');
  }
};

export const convertFilesToMarkdownWithOptions = async (
  packagesToConvert: conversionPackage[],
  wasCanceled: () => boolean,
  onError: (message: string) => void
): Promise<File[]> => {
  const newFiles: File[] = [];

  // Convert files to .md if needed
  for (const filePackage of packagesToConvert) {
    if (!wasCanceled()) {
      try {
        const convertedFile = await convertToMarkdownWithOptionsIfNeeded(filePackage);
        newFiles.push(convertedFile);
      } catch (err) {
        if (err instanceof Error) {
          console.error('File conversion failed for:', filePackage.file.name, err);
          onError(`Could not convert file: ${filePackage.file.name}. ${err.message}`);
        } else {
          console.error('File conversion failed for:', filePackage.file.name, err);
          onError(`Could not convert file: ${filePackage.file.name}. An unknown error occurred.`);
        }
      }
    }
  }

  // Update states
  return newFiles;
};