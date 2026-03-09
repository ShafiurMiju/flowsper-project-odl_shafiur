// src/app/api/social-media/accounts/route.ts

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const accessToken = authHeader?.replace('Bearer ', '');

    if (!accessToken) {
      return NextResponse.json(
        { error: 'Unauthorized - No access token' },
        { status: 401 }
      );
    }

    // Make request to GHL social media accounts API
    const response = await fetch('https://services.leadconnectorhq.com/social-media-posting/tc4QYWapkvuynWNE4abr/accounts', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Version': '2021-07-28',
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`GHL API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching social media accounts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch social media accounts' },
      { status: 500 }
    );
  }
}