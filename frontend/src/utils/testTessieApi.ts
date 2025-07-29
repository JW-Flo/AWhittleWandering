// Test utility to validate Tessie API connection
export const testTessieApi = async (apiKey: string) => {
  console.log('Testing Tessie API with key:', apiKey.substring(0, 10) + '...');
  
  try {
    const response = await fetch('https://api.tessie.com/vehicles', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    console.log('Test API response:', {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries())
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Test API error response:', errorText);
      return {
        success: false,
        error: `${response.status} ${response.statusText}: ${errorText}`
      };
    }

    const data = await response.json();
    console.log('Test API success - data keys:', Object.keys(data));
    console.log('Test API vehicle count:', data.results?.length || 0);
    
    return {
      success: true,
      data,
      vehicleCount: data.results?.length || 0
    };
  } catch (error) {
    console.error('Test API network error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error'
    };
  }
};
