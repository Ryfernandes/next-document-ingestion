// src/app/mcp-client/page.tsx

'use client';

import {
  Content,
  TextInput,
  Button,
  Flex,
  FlexItem
} from '@patternfly/react-core'

import { useState, useEffect } from 'react';

const Page = () => {
  const [query, setQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [response, setResponse] = useState<string>('');

  const handleSend = async () => {
    setLoading(true);

    alert('Sending query: ' + query);

    setTimeout(() => {
      setLoading(false);
    }, 3000);
  }

  return (
    <Flex style={{ "padding": '2rem' }} direction={{ default: 'column' }} gap={{ default: 'gapMd' }}>
      <Content component='p'>
        Send requests to the MCP client in the text box below.
      </Content>
      <Flex>
        <FlexItem>
          <TextInput
            value={query}
            isDisabled={loading}
            type='text'
            onChange={(_event, value) => setQuery(value)}
            placeholder='Enter your query here...'
            aria-label='MCP Client Query Input'
          />
        </FlexItem>
        <FlexItem>
          <Button
            variant='primary'
            onClick={handleSend}
            isLoading={loading}
            isDisabled={loading || query.trim() === ''}
          >
            Send
          </Button>
        </FlexItem>
      </Flex>
      <FlexItem style={{ "marginTop": '1rem' }}>
        <Content component='h3'>
          MCP Client Response:
        </Content>
      </FlexItem>
      <FlexItem>
        <Content component='p'>
          {response || 'No response yet.'}
        </Content>
      </FlexItem>
    </Flex>
  )
}

export default Page;