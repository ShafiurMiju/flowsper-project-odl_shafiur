// src/app/api/social-media/statistics/route.ts

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const accessToken = authHeader?.replace('Bearer ', '');

    if (!accessToken) {
      return NextResponse.json(
        { error: 'Unauthorized - No access token' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { profileIds, platforms } = body;

    if (!profileIds || !platforms) {
      return NextResponse.json(
        { error: 'Missing required fields: profileIds and platforms' },
        { status: 400 }
      );
    }

    // Make request to GHL social media statistics API
    const response = await fetch('https://services.leadconnectorhq.com/social-media-posting/statistics?locationId=tc4QYWapkvuynWNE4abr', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Version': '2021-07-28',
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        profileIds,
        platforms,
      }),
    });

    if (!response.ok) {
      throw new Error(`GHL API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching social media statistics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch social media statistics' },
      { status: 500 }
    );
  }
}