/**
 * Detail API Route
 * Fetches video details including episodes and M3U8 URLs
 */

import { NextRequest, NextResponse } from 'next/server';
import { getVideoDetail, getVideoDetailCustom } from '@/lib/api/client';
import { getSourceById } from '@/lib/api/video-sources';
import type { DetailRequest } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');
    const source = searchParams.get('source');
    const customApi = searchParams.get('customApi');

    // Validate input
    if (!id) {
      return NextResponse.json(
        { error: 'Missing video ID parameter' },
        { status: 400 }
      );
    }

    // Handle custom API case
    if (customApi) {
      try {
        const videoDetail = await getVideoDetailCustom(id, customApi);
        
        return NextResponse.json({
          success: true,
          data: videoDetail,
        });
      } catch (error) {
        return NextResponse.json(
          {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to fetch video detail',
          },
          { status: 500 }
        );
      }
    }

    // Validate source
    if (!source) {
      return NextResponse.json(
        { error: 'Missing source parameter' },
        { status: 400 }
      );
    }

    const sourceConfig = getSourceById(source);
    
    if (!sourceConfig) {
      return NextResponse.json(
        { error: 'Invalid source ID' },
        { status: 400 }
      );
    }

    // Fetch video detail
    try {
      const videoDetail = await getVideoDetail(id, sourceConfig);
      
      return NextResponse.json({
        success: true,
        data: videoDetail,
      });
    } catch (error) {
      console.error('Detail API error:', error);
      
      return NextResponse.json(
        {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to fetch video detail',
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Detail API error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}

// Support POST method for complex requests
export async function POST(request: NextRequest) {
  try {
    const body: DetailRequest = await request.json();
    const { id, source, customApi } = body;

    // Validate input
    if (!id) {
      return NextResponse.json(
        { error: 'Missing video ID parameter' },
        { status: 400 }
      );
    }

    // Handle custom API case
    if (customApi) {
      try {
        const videoDetail = await getVideoDetailCustom(id, customApi);
        
        return NextResponse.json({
          success: true,
          data: videoDetail,
        });
      } catch (error) {
        return NextResponse.json(
          {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to fetch video detail',
          },
          { status: 500 }
        );
      }
    }

    // Validate source
    if (!source) {
      return NextResponse.json(
        { error: 'Missing source parameter' },
        { status: 400 }
      );
    }

    const sourceConfig = getSourceById(source);
    
    if (!sourceConfig) {
      return NextResponse.json(
        { error: 'Invalid source ID' },
        { status: 400 }
      );
    }

    // Fetch video detail
    try {
      const videoDetail = await getVideoDetail(id, sourceConfig);
      
      return NextResponse.json({
        success: true,
        data: videoDetail,
      });
    } catch (error) {
      console.error('Detail API error:', error);
      
      return NextResponse.json(
        {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to fetch video detail',
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Detail API error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
