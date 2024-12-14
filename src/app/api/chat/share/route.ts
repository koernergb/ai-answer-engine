import { NextRequest, NextResponse } from 'next/server';
import { createShareLink } from '@/lib/shareUtils';

export async function POST(request: NextRequest) {
  try {
    console.log('Received share request:', request.body);
    const { messages, contextFromUrls } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      console.error('Invalid conversation data');
      return NextResponse.json({ error: 'Invalid conversation data' }, { status: 400 });
    }

    const shareId = createShareLink(messages, contextFromUrls);
    console.log('Created share ID:', shareId);

    return NextResponse.json({ shareId });
  } catch (error) {
    console.error('Share conversation error:', error);
    return NextResponse.json({ error: 'Failed to share conversation' }, { status: 500 });
  }
}