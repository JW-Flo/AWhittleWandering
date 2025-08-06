import React, { useState, useEffect } from 'react';

const SimpleTest = () => {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('https://awhittlewandering-api.kd8jc7v8cd.workers.dev/api/v1/unified-data');
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div style={{ padding: '20px', backgroundColor: 'blue', color: 'white', minHeight: '100vh' }}>
        <h1>Loading Tesla Data...</h1>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '20px', backgroundColor: 'red', color: 'white', minHeight: '100vh' }}>
        <h1>Error: {error}</h1>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', backgroundColor: 'green', color: 'white', minHeight: '100vh' }}>
      <h1>Tesla Data Loaded Successfully!</h1>
      <div style={{ backgroundColor: 'rgba(0,0,0,0.2)', padding: '10px', marginTop: '20px' }}>
        <h2>Trip: {data?.overview?.tripName}</h2>
        <p>Vehicle: {data?.overview?.vehicle}</p>
        <p>Battery: {data?.currentStatus?.battery?.level}%</p>
        <p>Location: {data?.currentStatus?.location?.state}</p>
        <p>Coordinates: {data?.currentStatus?.location?.coordinates?.lat}, {data?.currentStatus?.location?.coordinates?.lng}</p>
      </div>
    </div>
  );
};

export default SimpleTest;
