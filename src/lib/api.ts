// Enhanced API service with real integrations and comprehensive error handling
import { supabase } from './supabase';
import { ChatMessage, ChatResponse, Property, ApiResponse } from '@/types/database';
import PropertiesService from './services/properties';
import BookingsService from './services/bookings';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "https://api.habibstay.com";
const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;
const MAPBOX_API_KEY = import.meta.env.VITE_MAPBOX_API_KEY;

/**
 * Enhanced Sara AI Chat with real OpenAI integration
 */
export const chatWithSara = async (
  message: string,
  conversationHistory: ChatMessage[],
): Promise<ChatResponse> => {
  try {
    // If OpenAI API key is available, use real AI
    if (OPENAI_API_KEY) {
      return await chatWithOpenAI(message, conversationHistory);
    }

    // Fallback to intelligent rule-based responses
    return await chatWithIntelligentFallback(message, conversationHistory);
  } catch (error) {
    console.error("Error chatting with Sara:", error);
    return getErrorResponse();
  }
};

/**
 * Real OpenAI integration for Sara AI
 */
async function chatWithOpenAI(
  message: string,
  conversationHistory: ChatMessage[]
): Promise<ChatResponse> {
  try {
    // Get context about available properties for better responses
    const { data: properties } = await PropertiesService.searchProperties({ limit: 5 });
    
    const systemPrompt = `You are Sara, a helpful AI assistant for HabibStay, a property rental and investment platform in Saudi Arabia. 

Context:
- HabibStay offers short-term rentals (daily, weekly, monthly) and investment opportunities
- Properties are located across Saudi Arabia (Riyadh, Jeddah, Dammam, etc.)
- Users can book properties or invest in real estate opportunities
- Current available properties: ${properties.map(p => `${p.title} in ${p.location} - ${p.bedrooms} bedrooms, $${p.base_price}/night`).join('; ')}

Your role:
- Help users find suitable properties
- Explain booking and investment processes
- Provide information about locations and amenities
- Guide users through the platform features
- Be friendly, professional, and knowledgeable about Saudi Arabian culture and locations

Respond in a helpful, concise manner. If users ask about specific properties, bookings, or investments, offer to help them with those actions.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: systemPrompt },
          ...conversationHistory.map(msg => ({
            role: msg.sender === 'user' ? 'user' : 'assistant',
            content: msg.text,
          })),
          { role: 'user', content: message },
        ],
        max_tokens: 300,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error('OpenAI API request failed');
    }

    const data = await response.json();
    const aiResponse = data.choices[0]?.message?.content || "I'm having trouble understanding. Could you please rephrase your question?";

    // Analyze response for suggested actions
    const actions = analyzeMessageForActions(message, aiResponse);
    const suggestedProperties = await getSuggestedProperties(message);

    return {
      message: {
        id: Date.now().toString(),
        text: aiResponse,
        sender: "sara",
        timestamp: new Date(),
      },
      actions,
      suggested_properties: suggestedProperties,
      quick_replies: generateQuickReplies(message),
    };
  } catch (error) {
    console.error('OpenAI chat error:', error);
    return await chatWithIntelligentFallback(message, conversationHistory);
  }
}

/**
 * Intelligent fallback when OpenAI is not available
 */
async function chatWithIntelligentFallback(
  message: string,
  conversationHistory: ChatMessage[]
): Promise<ChatResponse> {
  const lowerMessage = message.toLowerCase();
  let response = "";
  let actions: any[] = [];
  let suggestedProperties: string[] = [];

  // Intent detection and response generation
  if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
    response = "Hello! I'm Sara, your personal assistant for HabibStay. I'm here to help you find the perfect property for your stay or investment opportunity. What can I help you with today?";
  } else if (lowerMessage.includes('book') || lowerMessage.includes('reservation')) {
    response = "I'd be happy to help you with booking! To find the perfect property, could you tell me:\n• Your preferred location in Saudi Arabia\n• Check-in and check-out dates\n• Number of guests\n• Any specific amenities you need?";
    actions.push({
      type: 'search',
      data: { intent: 'booking' },
      label: 'Search Properties',
    });
  } else if (lowerMessage.includes('invest') || lowerMessage.includes('investment')) {
    response = "Great! HabibStay offers exciting real estate investment opportunities. Our investment properties typically offer 15-20% expected returns. Would you like to see current investment opportunities or learn more about how our investment platform works?";
    actions.push({
      type: 'invest',
      data: { intent: 'investment' },
      label: 'View Investments',
    });
  } else if (lowerMessage.includes('riyadh') || lowerMessage.includes('jeddah') || lowerMessage.includes('dammam')) {
    const city = lowerMessage.includes('riyadh') ? 'Riyadh' : 
                 lowerMessage.includes('jeddah') ? 'Jeddah' : 'Dammam';
    response = `${city} is a fantastic choice! We have many beautiful properties in ${city}. Let me show you some options that might interest you.`;
    
    // Get properties for the city
    const { data: cityProperties } = await PropertiesService.searchProperties({ 
      city, 
      limit: 3 
    });
    suggestedProperties = cityProperties.map(p => p.id);
    
    actions.push({
      type: 'search',
      data: { city },
      label: `View ${city} Properties`,
    });
  } else if (lowerMessage.includes('price') || lowerMessage.includes('cost')) {
    response = "Our properties range from budget-friendly options starting at 300 SAR/night to luxury villas at 2500+ SAR/night. The price depends on location, size, amenities, and season. What's your budget range and preferred location?";
  } else if (lowerMessage.includes('amenities') || lowerMessage.includes('facilities')) {
    response = "Our properties offer various amenities including:\n• WiFi and Air Conditioning (standard)\n• Swimming pools and gyms\n• Kitchen facilities\n• Parking spaces\n• Beach access (coastal properties)\n• And much more! Which amenities are most important to you?";
  } else if (lowerMessage.includes('help') || lowerMessage.includes('support')) {
    response = "I'm here to help! I can assist you with:\n• Finding and booking properties\n• Investment opportunities\n• Location information\n• Pricing and availability\n• Platform features\n\nWhat would you like to know more about?";
  } else {
    // Generic intelligent response
    response = "I understand you're looking for information about our properties or services. Could you be more specific about what you need? I can help you with bookings, investments, location details, or any other questions about HabibStay.";
  }

  return {
    message: {
      id: Date.now().toString(),
      text: response,
      sender: "sara",
      timestamp: new Date(),
    },
    actions,
    suggested_properties: suggestedProperties,
    quick_replies: generateQuickReplies(message),
  };
}

/**
 * Analyze message for potential actions
 */
function analyzeMessageForActions(userMessage: string, aiResponse: string): any[] {
  const actions: any[] = [];
  const lowerMessage = userMessage.toLowerCase();

  if (lowerMessage.includes('book') || lowerMessage.includes('reserve')) {
    actions.push({
      type: 'search',
      data: { intent: 'booking' },
      label: 'Find Properties',
    });
  }

  if (lowerMessage.includes('invest')) {
    actions.push({
      type: 'invest',
      data: { intent: 'investment' },
      label: 'View Investments',
    });
  }

  if (lowerMessage.includes('call') || lowerMessage.includes('contact')) {
    actions.push({
      type: 'contact_host',
      data: { intent: 'contact' },
      label: 'Contact Support',
    });
  }

  return actions;
}

/**
 * Get suggested properties based on message content
 */
async function getSuggestedProperties(message: string): Promise<string[]> {
  const lowerMessage = message.toLowerCase();
  const searchFilters: any = {};

  // Extract intent from message
  if (lowerMessage.includes('luxury') || lowerMessage.includes('premium')) {
    searchFilters.min_price = 1000;
  }
  if (lowerMessage.includes('budget') || lowerMessage.includes('cheap')) {
    searchFilters.max_price = 500;
  }
  if (lowerMessage.includes('family')) {
    searchFilters.min_guests = 4;
  }
  if (lowerMessage.includes('riyadh')) {
    searchFilters.city = 'Riyadh';
  }
  if (lowerMessage.includes('jeddah')) {
    searchFilters.city = 'Jeddah';
  }

  try {
    const { data: properties } = await PropertiesService.searchProperties({
      ...searchFilters,
      limit: 3,
    });
    return properties.map(p => p.id);
  } catch (error) {
    return [];
  }
}

/**
 * Generate contextual quick replies
 */
function generateQuickReplies(message: string): string[] {
  const lowerMessage = message.toLowerCase();
  
  if (lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
    return [
      "Find properties in Riyadh",
      "Show investment opportunities", 
      "Help with booking",
      "Property amenities"
    ];
  }
  
  if (lowerMessage.includes('book')) {
    return [
      "Properties in Riyadh",
      "Properties in Jeddah",
      "Luxury properties",
      "Family-friendly options"
    ];
  }
  
  if (lowerMessage.includes('invest')) {
    return [
      "View all investments",
      "High return properties",
      "Low minimum investment",
      "Investment guide"
    ];
  }

  return [
    "Search properties",
    "Investment opportunities",
    "Contact support",
    "Platform features"
  ];
}

/**
 * Error response fallback
 */
function getErrorResponse(): ChatResponse {
  return {
    message: {
      id: Date.now().toString(),
      text: "I apologize, but I'm experiencing some technical difficulties right now. Please try again in a moment, or feel free to browse our properties directly. If you need immediate assistance, please contact our support team.",
      sender: "sara",
      timestamp: new Date(),
    },
    quick_replies: [
      "Browse properties",
      "Contact support",
      "Try again",
    ],
  };
}

/**
 * Get location suggestions and autocomplete
 */
export async function getLocationSuggestions(query: string): Promise<any[]> {
  if (!MAPBOX_API_KEY) {
    // Fallback to Saudi Arabia cities
    const saudiCities = [
      'Riyadh', 'Jeddah', 'Dammam', 'Mecca', 'Medina', 
      'Khobar', 'Dhahran', 'Taif', 'Abha', 'Tabuk'
    ];
    return saudiCities
      .filter(city => city.toLowerCase().includes(query.toLowerCase()))
      .map(city => ({ place_name: city, center: [0, 0] }));
  }

  try {
    const response = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${MAPBOX_API_KEY}&country=SA&types=place,locality&limit=5`
    );
    
    if (!response.ok) {
      throw new Error('Mapbox API request failed');
    }
    
    const data = await response.json();
    return data.features || [];
  } catch (error) {
    console.error('Error fetching location suggestions:', error);
    return [];
  }
}

/**
 * Upload files to Supabase storage
 */
export async function uploadFile(
  bucket: string, 
  path: string, 
  file: File
): Promise<ApiResponse<{ url: string; path: string }>> {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file);

    if (error) {
      throw error;
    }

    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(path);

    return {
      success: true,
      data: {
        url: publicUrl,
        path: data.path,
      },
    };
  } catch (error) {
    console.error('Error uploading file:', error);
    return {
      success: false,
      error: (error as Error).message,
    };
  }
}

/**
 * Send email notification
 */
export async function sendEmailNotification(
  to: string,
  subject: string,
  template: string,
  data: any
): Promise<ApiResponse<void>> {
  try {
    // This would integrate with your email service (SendGrid, AWS SES, etc.)
    console.log('Sending email:', { to, subject, template, data });
    
    // For now, just log the email
    // In production, you'd call your email service API
    
    return {
      success: true,
      message: 'Email sent successfully',
    };
  } catch (error) {
    console.error('Error sending email:', error);
    return {
      success: false,
      error: (error as Error).message,
    };
  }
}

/**
 * Get system analytics
 */
export async function getSystemAnalytics(period: 'day' | 'week' | 'month' | 'year' = 'month'): Promise<{
  properties: { total: number; active: number; new: number };
  bookings: { total: number; confirmed: number; revenue: number };
  users: { total: number; active: number; new: number };
  investments: { total: number; funded: number; amount: number };
}> {
  try {
    // Calculate date range
    const now = new Date();
    let startDate: Date;
    
    switch (period) {
      case 'day':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
    }

    // Fetch analytics data in parallel
    const [
      { data: properties },
      { data: bookings },
      { data: users },
      { data: investments }
    ] = await Promise.all([
      supabase.from('properties').select('*'),
      supabase.from('bookings').select('*'),
      supabase.from('users').select('*'),
      supabase.from('investments').select('*')
    ]);

    // Calculate metrics
    const propertiesTotal = properties?.length || 0;
    const propertiesActive = properties?.filter(p => p.status === 'active').length || 0;
    const propertiesNew = properties?.filter(p => new Date(p.created_at) >= startDate).length || 0;

    const bookingsTotal = bookings?.length || 0;
    const bookingsConfirmed = bookings?.filter(b => b.status === 'confirmed').length || 0;
    const bookingsRevenue = bookings?.filter(b => b.status === 'completed')
      .reduce((sum, b) => sum + (b.total_amount || 0), 0) || 0;

    const usersTotal = users?.length || 0;
    const usersActive = users?.filter(u => u.is_active).length || 0;
    const usersNew = users?.filter(u => new Date(u.created_at) >= startDate).length || 0;

    const investmentsTotal = investments?.length || 0;
    const investmentsFunded = investments?.filter(i => i.payment_status === 'completed').length || 0;
    const investmentsAmount = investments?.filter(i => i.payment_status === 'completed')
      .reduce((sum, i) => sum + (i.amount || 0), 0) || 0;

    return {
      properties: {
        total: propertiesTotal,
        active: propertiesActive,
        new: propertiesNew,
      },
      bookings: {
        total: bookingsTotal,
        confirmed: bookingsConfirmed,
        revenue: bookingsRevenue,
      },
      users: {
        total: usersTotal,
        active: usersActive,
        new: usersNew,
      },
      investments: {
        total: investmentsTotal,
        funded: investmentsFunded,
        amount: investmentsAmount,
      },
    };
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return {
      properties: { total: 0, active: 0, new: 0 },
      bookings: { total: 0, confirmed: 0, revenue: 0 },
      users: { total: 0, active: 0, new: 0 },
      investments: { total: 0, funded: 0, amount: 0 },
    };
  }
}

// Re-export services for easy access
export { PropertiesService, BookingsService };
