import React, { useState, useEffect } from 'react';
import api from '../../shared/services/api';

export default function TestComplaintsAPI() {
  const [status, setStatus] = useState('loading');
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const test = async () => {
      try {
        console.log('[TEST] Starting API call to /api/grievances/');
        const response = await api.get('/api/grievances/', { params: { per_page: 100 } });
        
        console.log('[TEST] Raw response:', response);
        console.log('[TEST] response.data:', response.data);
        
        setData(response);
        setStatus('success');
      } catch (err) {
        console.error('[TEST] Error:', err);
        setError(err);
        setStatus('error');
      }
    };
    
    test();
  }, []);

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h2>API Test Page</h2>
      <p>Status: {status}</p>
      
      {status === 'loading' && <p>Loading...</p>}
      
      {status === 'error' && (
        <div style={{ color: 'red' }}>
          <h3>Error:</h3>
          <pre>{JSON.stringify(error, null, 2)}</pre>
        </div>
      )}
      
      {status === 'success' && (
        <div style={{ color: 'green' }}>
          <h3>Success!</h3>
          <h4>Raw Response Structure:</h4>
          <pre>{JSON.stringify(data, null, 2)}</pre>
          
          {data && (
            <>
              <h4>Checking Data Structure:</h4>
              <ul>
                <li>response.data exists: {data.data ? 'YES' : 'NO'}</li>
                <li>response.data is array: {Array.isArray(data.data) ? 'YES' : 'NO'}</li>
                <li>response.data.value exists: {data.data?.value ? 'YES' : 'NO'}</li>
                <li>response.data.value is array: {Array.isArray(data.data?.value) ? 'YES' : 'NO'}</li>
                <li>response.data.value length: {data.data?.value?.length || 0}</li>
                <li>response.data.Count: {data.data?.Count || 'N/A'}</li>
              </ul>
              
              {data.data?.value && data.data.value.length > 0 && (
                <>
                  <h4>First Item:</h4>
                  <pre>{JSON.stringify(data.data.value[0], null, 2)}</pre>
                </>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
