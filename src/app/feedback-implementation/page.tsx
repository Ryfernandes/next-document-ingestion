// src/app/feedback-implementation/page.tsx

'use client';

import {useState, useEffect} from 'react';

import IngestionManager from '@/components/FeedbackComponents/IngestionManager';
import DoclingConfiguration from '@/components/ConfigurationComponents/DoclingConfiguration';

const Page = () => {
  const [port, setPort] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  const checkPort = async () => {
    setLoading(true);

    let serverPort = port;

    if (port == '') {
      serverPort = '5001';
    }

    const baseUrl = `http://localhost:${serverPort}`;
    try {
      const healthRes = await fetch(`${baseUrl}/health`);

      if (!healthRes.ok) {
        console.error('The file conversion service is offline or returned non-OK status:', healthRes.status, healthRes.statusText);
        setLoading(false);
        return;
      }

      const healthData = await healthRes.json();
      if (!healthData.status || healthData.status !== 'ok') {
        console.error('Doc->md conversion service health check response not "ok":', healthData);
        setLoading(false);
        return;
      }

      setPort(serverPort);
      setLoading(false);
      return;
    } catch (error: unknown) {
      console.error('Error conversion service health check:', error);
      setLoading(false);
      return;
    }
  }

  useEffect(() => {
    checkPort();
  }, [])

  return (
    <>
      {loading ? (
        <div>
          Loading...
        </div>
      ) : (
        port != '' ? (
          <IngestionManager localPort={port} returnPort={setPort} />
        ) : (
          <DoclingConfiguration returnPort={setPort}/>
        )
      )}
    </>
  )
}

export default Page;