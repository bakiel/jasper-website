import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.JASPER_CRM_API_URL || 'http://72.61.201.237:8001';

export async function GET(
  request: NextRequest,
  { params }: { params: { filename: string } }
) {
  const filename = params.filename;

  // Security: Only allow image files
  if (!filename.match(/\.(jpg|jpeg|png|webp|gif)$/i)) {
    return NextResponse.json({ error: 'Invalid file type' }, { status: 400 });
  }

  // Security: No path traversal
  if (filename.includes('..') || filename.includes('/')) {
    return NextResponse.json({ error: 'Invalid filename' }, { status: 400 });
  }

  try {
    const imageUrl = `${BACKEND_URL}/api/v1/images/generated/${filename}`;
    const response = await fetch(imageUrl);

    if (!response.ok) {
      return NextResponse.json({ error: 'Image not found' }, { status: 404 });
    }

    const imageBuffer = await response.arrayBuffer();
    const contentType = response.headers.get('content-type') || 'image/jpeg';

    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('Image proxy error:', error);
    return NextResponse.json({ error: 'Failed to fetch image' }, { status: 500 });
  }
}
