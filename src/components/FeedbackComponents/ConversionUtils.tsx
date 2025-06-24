// src/components/FeedbackComponents/ConversionUtils.tsx

import { conversionProfile } from "@/utils/conversionProfiles";

type ConversionPackage = {
  file: File;
  profile: conversionProfile;
}

type Resource = {
  datetimeUploaded: Date;
  originalFile: File | null;
  file: File;
  conversionProfile: string;
}

type ResourcePackageGroup = {
  resource: Resource;
  conversionProfile: conversionProfile;
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

const convertToMarkdownWithOptions = async (filePackage: ConversionPackage, signal: AbortSignal): Promise<BlobPart[]> => {
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

  try {
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
      }),
      signal
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
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw err
    }

    throw err instanceof Error ? err : new Error('Unknown error during conversion.');
  }
};

const convertToMarkdownWithOptionsIfNeeded = async (filePackage: ConversionPackage, signal: AbortSignal): Promise<File> => {
  // If user picked a .md file, no need to call the conversion route
  if (filePackage.file.name.toLowerCase().endsWith('.md')) {
    return filePackage.file;
  }

  try {
    const blobParts = await convertToMarkdownWithOptions(filePackage, signal);

    // Create a new `.md` File object
    const newName = filePackage.file.name.replace(/\.[^/.]+$/, '') + '.md';
    const mdBlob = new Blob(blobParts, { type: 'text/markdown' });
    return new File([mdBlob], newName, { type: 'text/markdown' });
  } catch (error: unknown) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw error
    }

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
  toConvertRef: React.RefObject<ResourcePackageGroup[]>,
  abortControllerRef: React.RefObject<AbortController>,
  wasCanceled: () => boolean,
  returnResource: (newResource: Resource) => void,
  onError: (message: string) => void,
  start: () => void,
  reset: () => void
) => {
  const newFiles: File[] = [];

  // Convert files to .md if needed
  while (toConvertRef.current.length > 0) {
    if (!wasCanceled()) {
      const resourcePackage = toConvertRef.current[0];

      try {
        // Start timer
        start();

        abortControllerRef.current = new AbortController();
        const convertedFile = await convertToMarkdownWithOptionsIfNeeded({ file: resourcePackage.resource.file, profile: resourcePackage.conversionProfile }, abortControllerRef.current.signal);
        const newResource = { ...resourcePackage.resource, originalFile: resourcePackage.resource.file, file: convertedFile, datetimeConverted: new Date() };
        
        returnResource(newResource);
        toConvertRef.current.shift();

        // Reset timer
        reset();
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') {
          console.log('Aborted conversion')
        } else if (err instanceof Error) {
          console.error('File conversion failed for:', resourcePackage.resource.file.name, err);
          onError(`Could not convert file: ${resourcePackage.resource.file.name}. ${err.message}`);
        } else {
          console.error('File conversion failed for:', resourcePackage.resource.file.name, err);
          onError(`Could not convert file: ${resourcePackage.resource.file.name}. An unknown error occurred.`);
        }
      }
    }
  }

  // Update states
  return newFiles;
};