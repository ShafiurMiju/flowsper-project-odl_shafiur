import { NextRequest, NextResponse } from 'next/server';
import { getGHLClientForRequest } from '@/lib';

/**
 * GET /api/phone-numbers
 * Fetch phone numbers for the current location
 */
export async function GET(request: NextRequest) {
  try {
    console.log('📞 Phone numbers API called');
    const clientResult = await getGHLClientForRequest(request);
    
    if (clientResult.error) {
      console.error('📞 Auth error:', clientResult.error);
      return NextResponse.json(
        { error: clientResult.error },
        { status: clientResult.status || 500 }
      );
    }

    const { ghlClient } = clientResult;
    console.log('📞 Calling GHL API for phone numbers...');
    const response = await ghlClient.getPhoneNumbers();
    console.log('📞 GHL API response:', JSON.stringify(response, null, 2));
    return NextResponse.json(response);
  } catch (error) {
    console.error('📞 Failed to fetch phone numbers:', error);
    return NextResponse.json(
      { phoneNumbers: [], total: 0 },
      { status: 200 }
    );
  }
}
