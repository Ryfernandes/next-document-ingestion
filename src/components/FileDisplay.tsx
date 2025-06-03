// src/components/FileDisplay.tsx

import { 
  Content,
  Flex,
  FlexItem
} from '@patternfly/react-core';

interface FileDisplayProps {
  files: File[];
}

const FileDisplay: React.FunctionComponent<FileDisplayProps> = ({ files }) => {

  return (
    <>
      <Content component="h2">Your markdown files:</Content>
      {files.length > 0 ? (
        files.map(file => (
          <Flex key={file.name} columnGap={{ default: 'columnGapSm' }}>
            <FlexItem>
              <Content component='p'> 
                {file.name}
              </Content>
            </FlexItem>
            <FlexItem>
              <Content component='a' href={URL.createObjectURL(file)} target='_blank'> 
                Open
              </Content>
            </FlexItem>
          </Flex>
          ))
        ) : (
          <Content component="p">No files added</Content>
        )
      }
    </>
  );
}

export default FileDisplay;