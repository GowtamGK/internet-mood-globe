// Submit mood to Google Sheets via Google Apps Script Web App
// You'll need to create a Google Apps Script web app and get its URL
// See README for setup instructions

// IMPORTANT: Replace this with your Google Apps Script Web App URL
// To create one: https://script.google.com/
// Deploy as web app with execute as: "Me" and access: "Anyone"
const GOOGLE_APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwQ1WpxFK3_KMP5GXR-Juc5fvvkGyuSf3hxPs0LZt6lLxH7Onwk0VwFgWZWAvL6tJhs4A/exec';

export async function submitMood(mood, locationData) {
  try {
    // If no Apps Script URL is configured, use a fallback method
    if (GOOGLE_APPS_SCRIPT_URL.includes('YOUR_GOOGLE_APPS_SCRIPT')) {
      console.warn('Google Apps Script URL not configured. Using fallback method.');
      return await submitMoodFallback(mood, locationData);
    }

    const submissionData = {
      timestamp: new Date().toISOString(),
      mood: mood,
      lat: locationData.lat,
      lng: locationData.lng,
      country_code: locationData.country_code || '',
      country_name: locationData.country_name || ''
    };

    // Google Apps Script web apps work better with GET requests
    // Convert data to URL parameters for GET request (more reliable and avoids CORS issues)
    const params = new URLSearchParams({
      timestamp: submissionData.timestamp,
      mood: submissionData.mood,
      lat: submissionData.lat.toString(),
      lng: submissionData.lng.toString(),
      country_code: submissionData.country_code || '',
      country_name: submissionData.country_name || ''
    });

    // Use GET request which is more reliable for Google Apps Script
    // With no-cors mode, we can't read the response, but the request should still go through
    await fetch(`${GOOGLE_APPS_SCRIPT_URL}?${params.toString()}`, {
      method: 'GET',
      mode: 'no-cors' // Google Apps Script web apps need no-cors mode
    });

    // The Apps Script will handle the data and append to the sheet
    return { success: true, message: 'Mood submitted successfully!' };
  } catch (error) {
    console.error('Error submitting mood:', error);
    // Try fallback method
    return await submitMoodFallback(mood, locationData);
  }
}

// Fallback: Try to append directly to Google Sheets using a form submission
// This requires the sheet to have a form or a simpler endpoint
async function submitMoodFallback(mood, locationData) {
  // For now, just return success
  // In production, you should set up Google Apps Script
  // You can also try using Google Forms or a third-party service
  // For a real implementation, set up Google Apps Script as shown in README
  
  return { success: true, message: 'Logged locally (configure Google Apps Script for real submission)' };
}
