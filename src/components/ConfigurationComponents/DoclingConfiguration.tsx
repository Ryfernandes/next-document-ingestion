// src/components/ConfigurationComponents/DoclingConfiguration.tsx

'use client';

import { useState } from 'react';

import {
  Content,
  Flex,
  ClipboardCopy,
  HelperText,
  TextInput,
  FlexItem,
  Button,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter
} from '@patternfly/react-core';

type DoclingConfigurationProps = {
  returnPort: (port: string) => void;
}

const DoclingConfiguration: React.FunctionComponent<DoclingConfigurationProps> = ({ returnPort }) => {
  const [port, setPort] = useState<string>('');
  const [showSuccess, setShowSuccess] = useState<boolean>(false);
  const [showError, setShowError] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  const handlePortChange = (value: string) => {
    let newPort = value;

    if (value.length > 4) {
      newPort = value.slice(0, 4);
    }
    setPort(newPort);
  };

  const handleConfirmPort = async () => {
    setLoading(true);

    let serverPort = port;

    if (port == '') {
      serverPort = '5001';
    }

    const baseUrl = `http://localhost:${serverPort}`;
    try {
      const healthRes = await fetch(`${baseUrl}/health`);
      setLoading(false);

      if (!healthRes.ok) {
        console.error('The file conversion service is offline or returned non-OK status:', healthRes.status, healthRes.statusText);
        setShowError(true);
        return;
      }

      const healthData = await healthRes.json();
      if (!healthData.status || healthData.status !== 'ok') {
        console.error('Doc->md conversion service health check response not "ok":', healthData);
        setShowError(true);
        return;
      }

      setPort(serverPort);
      setShowSuccess(true);
      return
    } catch (error: unknown) {
      setLoading(false);
      console.error('Error conversion service health check:', error);
      setShowError(true);
      return;
    }
  }

  return (
    <>
      <Flex style={{ width: '100%', height: '100%', backgroundImage: "linear-gradient(to right, #F56E6E, #F4784A)", padding: '2rem'}} justifyContent={{ default: 'justifyContentCenter'}}>
        <Flex flexWrap={{ default: 'nowrap' }} style={{ width: '100%', maxHeight: '100%', overflow: 'scroll', maxWidth: '1500px', backgroundColor: '#ffffff', padding: '3rem', flexDirection: 'column', gap: '1rem', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)' }}>
          <Content component='h1'>
            ⚙️ Docling Configuration
          </Content>
          <Content component='p'>
            Welcome to the deployed demo of the <strong>Document Ingestion UI</strong>! 👋 In order to avoid managing the 
            cost of running Docling as a service, this demo utilizes a locally running instance of Docling on the client's
            system. Please follow the quick instructions below to set up and verify your local Docling instance before proceeding 
            to the demo.
          </Content>

          <Content component='h2'>
            🛠️ Set Up Virtural Environment
          </Content>
          <Content component='p'>
            Navigate to the directory that you want to work out of and use the commands below to create and activate a 
            virtual environment:
          </Content>
          <ClipboardCopy
            isReadOnly
            hoverTip="Copy"
            clickTip="Copied"
            style={{ width: '100%', maxWidth: '1000px' }}
          >
            python3 -m venv venv
          </ClipboardCopy>
          <ClipboardCopy
            isReadOnly
            hoverTip="Copy"
            clickTip="Copied"
            style={{ width: '100%', maxWidth: '1000px' }}
          >
            source venv/bin/activate
          </ClipboardCopy>

          <Content component='h2'>
            📦 Install Docling-Serve
          </Content>
          <Content component='p'>
            With your virtual environment activated from the commands above, run the following command to install docling-serve:
          </Content>
          <ClipboardCopy
            isReadOnly
            hoverTip="Copy"
            clickTip="Copied"
            style={{ width: '100%', maxWidth: '1000px' }}
          >
            pip install "docling-serve"
          </ClipboardCopy>

          <Content component='h2'>
            🚀 Run Docling-Serve
          </Content>
          <Content component='p'>
            Now that docling-serve is installed, the final step is to run the service. Use the command below:
          </Content>
          <ClipboardCopy
            isReadOnly
            hoverTip="Copy"
            clickTip="Copied"
            style={{ width: '100%', maxWidth: '1000px' }}
          >
            docling-serve run
          </ClipboardCopy>

          <Content component='h2'>
            ✅ Validate Server
          </Content>
          <Content component='p'>
            That's it! 🎉 Docling-serve is now running locally on your machine. The last step is to confirm below 
            that the demo has access to your local Docling instance. When you entered the previous command, you should
            have seen an output similar to the following:
          </Content>
          <Flex>
            <Content component='p'>
              Server started at http://0.0.0.0:<strong style={{ textDecoration: 'underline' }}>5001</strong>
            </Content>
            <HelperText>
              (you may see "localhost" instead of "0.0.0.0")
            </HelperText>
          </Flex>
          <Content component='p'>
            In the message above, the last four digits represent the <strong>port</strong> that Docling is
            running on. <strong>Please copy this port number below and click "Confirm port"</strong> to verify that Docling is
            running correctly.
          </Content>
          <Content component='p'>
            <strong>‼️ Note:</strong> You must wait for the server to fully start before clicking "Confirm port". Look for the message: 
            "Uvicorn running on..." at the end of your terminal output
          </Content>
          <Flex>
            <FlexItem>
              <Content component='p'>
                <strong>Port number:</strong>
              </Content>
            </FlexItem>
            <FlexItem>
              <TextInput
                aria-label='Docling Port'
                value={port}
                type='text'
                placeholder='Default port: 5001'
                onChange={(_event, value) => handlePortChange(value)}
              />
            </FlexItem>
            <FlexItem>
              <Button
                onClick={handleConfirmPort}
              >
                👉 Confirm port
              </Button>
            </FlexItem>
          </Flex>
        </Flex>
      </Flex>

      {/* Success Modal */}
      <Modal
        isOpen={showSuccess}
        disableFocusTrap
        variant="small"
      >
        <ModalHeader
          title={"🎉 Success!"}
        />
        <ModalBody>
          <Content component='p'>
            The Document Ingestion UI is now ready to use with your local Docling instance. Click "Continue" to proceed.
          </Content>
        </ModalBody>
        <ModalFooter>
          <Button
            variant="primary"
            onClick={() => {
              setShowSuccess(false);
              returnPort(port);
            }}
          >
            Continue
          </Button>
        </ModalFooter>
      </Modal>

      {/* Error Modal */}
      <Modal
        isOpen={showError}
        disableFocusTrap
        variant="small"
      >
        <ModalHeader
          title={"🫤 Failed to Connect"}
        />
        <ModalBody>
          <Content component='p'>
            There was an issue connecting to your local Docling instance. <strong style={{ textDecoration: 'underline' }}>Please ensure that your port value is correct and retry.</strong>
          </Content>
          <Content component='p'>
            ‼️ Note: You must wait for the server to fully start before clicking "Confirm port". Look for the message: 
            "Uvicorn running on..." at the end of your terminal output
          </Content>
          <Content component='p'>
            If you are still having issues, please retry the setup steps or contact Ryan Fernandes on Slack.
          </Content>
        </ModalBody>
        <ModalFooter>
          <Button
            variant="primary"
            onClick={() => {
              setShowError(false);
            }}
            isLoading={loading}
          >
            Continue
          </Button>
        </ModalFooter>
      </Modal>
    </>
  )
}

export default DoclingConfiguration;