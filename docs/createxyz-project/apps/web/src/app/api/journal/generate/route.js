// AI-powered journal entry generation
export async function POST(request) {
  try {
    const body = await request.json();
    const { vehicleData, location, eventType, previousLocation } = body;

    if (!vehicleData || !eventType) {
      return Response.json(
        { error: 'Vehicle data and event type required' },
        { status: 400 }
      );
    }

    // Determine journal entry type and content
    let journalPrompt = '';
    let entryType = eventType;

    switch (eventType) {
      case 'charging_started':
        journalPrompt = `The Tesla started charging at ${location?.name || 'a charging station'}. 
Current battery: ${vehicleData.batteryLevel}%, Range: ${vehicleData.range} miles.
Create an engaging journal entry about starting a charging session. Include practical details and perhaps mention what the driver might do while waiting.`;
        break;

      case 'charging_completed':
        journalPrompt = `Charging session completed! Battery now at ${vehicleData.batteryLevel}%, Range: ${vehicleData.range} miles.
Create a satisfied journal entry about completing the charge and being ready for the next leg of the journey.`;
        break;

      case 'location_change':
        journalPrompt = `The Tesla has moved from ${previousLocation?.name || 'previous location'} to ${location?.name || 'a new location'}.
Current stats: ${vehicleData.speed} mph, ${vehicleData.batteryLevel}% battery, ${vehicleData.range} miles range.
Create an interesting travel journal entry about this location change or milestone.`;
        break;

      case 'efficiency_milestone':
        journalPrompt = `Great driving efficiency milestone! Current efficiency: ${vehicleData.efficiency} Wh/mile.
Battery: ${vehicleData.batteryLevel}%, Speed: ${vehicleData.speed} mph.
Create an encouraging journal entry celebrating good driving efficiency.`;
        break;

      case 'low_battery_warning':
        journalPrompt = `Battery is getting low at ${vehicleData.batteryLevel}% with ${vehicleData.range} miles remaining.
Create a helpful journal entry about managing range and finding the next charging option.`;
        break;

      default:
        journalPrompt = `Current Tesla status: ${vehicleData.batteryLevel}% battery, ${vehicleData.speed} mph, ${vehicleData.range} miles range.
Create an interesting general travel journal entry about the current journey.`;
    }

    // Generate AI journal entry
    const aiResponse = await fetch('/integrations/chat-gpt/conversationgpt4', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messages: [{
          role: 'system',
          content: `You are writing automated journal entries for a Tesla road trip. Write in first person as if the driver is speaking. Be engaging, informative, and capture the excitement of electric vehicle travel. Keep entries concise (2-4 sentences) but vivid. Focus on the experience, not just technical details.`
        }, {
          role: 'user',
          content: journalPrompt
        }],
        json_schema: {
          name: "journal_entry",
          schema: {
            type: "object",
            properties: {
              title: { type: "string" },
              content: { type: "string" },
              mood: { type: "string" },
              tags: {
                type: "array",
                items: { type: "string" }
              }
            },
            required: ["title", "content", "mood", "tags"],
            additionalProperties: false
          }
        }
      })
    });

    if (!aiResponse.ok) {
      throw new Error('Failed to generate AI journal entry');
    }

    const aiData = await aiResponse.json();
    const journalEntry = JSON.parse(aiData.choices[0].message.content);

    // Get location context using web scraping for POI information
    let locationContext = null;
    if (location?.name && location.name !== 'Unknown Location') {
      try {
        const searchQuery = `${location.name} tourist attractions points of interest`;
        const webResponse = await fetch('/integrations/web-scraping/post', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            url: `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`,
            getText: true
          })
        });

        if (webResponse.ok) {
          const webData = await webResponse.text();
          // Extract relevant info (simplified)
          locationContext = {
            searchResults: webData.substring(0, 500),
            hasResults: webData.length > 100
          };
        }
      } catch (error) {
        console.error('Failed to get location context:', error);
      }
    }

    // Enhanced journal entry with metadata
    const finalEntry = {
      id: `entry-${Date.now()}`,
      timestamp: new Date().toISOString(),
      type: entryType,
      location: location || null,
      vehicleStats: {
        battery: vehicleData.batteryLevel,
        range: vehicleData.range,
        speed: vehicleData.speed,
        efficiency: vehicleData.efficiency,
        odometer: vehicleData.odometer
      },
      ...journalEntry,
      locationContext,
      autoGenerated: true
    };

    return Response.json({
      success: true,
      entry: finalEntry,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Journal generation error:', error);
    return Response.json(
      { error: 'Failed to generate journal entry', details: error.message },
      { status: 500 }
    );
  }
}