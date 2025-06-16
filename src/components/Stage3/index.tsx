// src/components/Stage1/index.tsx

'use client';

import { useState, useEffect, useRef } from 'react';

import {
  Button,
  Content,
  Flex,
  FlexItem,
  HelperText,
  HelperTextItem
} from '@patternfly/react-core';

import { conversionProfile } from '@/utils/conversionProfiles';
import { convertFilesToMarkdown, convertFilesToMarkdownWithOptions } from '../FileUpload/fileConversionUtils';
import { start } from 'repl';

type fullConversionPackage = {
  file: File;
  profile: conversionProfile;
}

interface Stage3Props {
  nextStage: () => void;
  toConvert: fullConversionPackage[];
}

const Stage3: React.FunctionComponent<Stage3Props> = ({ nextStage, toConvert }) => {
  const [convertedDocuments, setConvertedDocuments] = useState<File[]>([]);
  const startedConversionRef = useRef(false);
  const [converting, setConverting] = useState(startedConversionRef.current);

  const options = true;

  const convertToMarkdown = async () => {
    setConverting(true);

    const toConvertFiles = toConvert.map(conversionPackage => conversionPackage.file);

    if (options) {
      await convertFilesToMarkdownWithOptions(toConvert, () => false, (message: string) => {alert(message)}).then(convertedFiles => {
        setConvertedDocuments(prev => [...prev, ...convertedFiles]);
      });
    } else {
      await convertFilesToMarkdown(toConvertFiles, () => false, (message: string) => {alert(message)}).then(convertedFiles => {
        setConvertedDocuments(prev => [...prev, ...convertedFiles]);
      });
    }

    setConverting(false);
  }

  useEffect(() => {
    if (toConvert.length && !startedConversionRef.current) {
      startedConversionRef.current = true;
      convertToMarkdown();
    }
  }, []);

  return (
    <Flex direction={{ default: 'column' }} rowGap={{ default: 'rowGap2xl'}}>
      <FlexItem>
        <Flex direction={{ default: 'column' }} rowGap={{ default: 'rowGapMd'}}>
          <FlexItem>
            <Content component='h1'>Step 3. Conversion</Content>
          </FlexItem>
          <FlexItem>
            <Content component='p'>The formal UI for this will be built alongside the revisions of Stage 1 and Stage 2. However, for proof-of-concept/prototyping, see your converted files below. The .env value IL_FILE_CONVERSION_SERVICE must have the endpoint for your instance of docling-serve in order for files to be converted</Content>
          </FlexItem>
        </Flex>
      </FlexItem>

      {converting && 
        <FlexItem>
          <Content component='p'>Converting...</Content>
        </FlexItem>
      }

      {convertedDocuments.map(file => (
        <div>
          <Content key={file.name} component='a' href={URL.createObjectURL(file)} target='_blank'> 
            {file.name}
          </Content>
        </div>
      ))}

      <FlexItem>
        <Button isDisabled={false} onClick={() => nextStage()}>Continue</Button>
      </FlexItem>
    </Flex>
  )
}

export default Stage3;