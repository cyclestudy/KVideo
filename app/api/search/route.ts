/**
 * Search API Route
 * Handles video search requests and aggregates results from multiple sources
 */

import { NextRequest, NextResponse } from 'next/server';
import { searchVideos } from '@/lib/api/client';
import { getEnabledSources, getSourceById } from '@/lib/api/video-sources';
import type { SearchRequest, SearchResult } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const body: SearchRequest = await request.json();
    const { query, sources: sourceIds, page = 1 } = body;

    // Validate input
    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return NextResponse.json(
        { error: 'Invalid or missing query parameter' },
        { status: 400 }
      );
    }

    if (!sourceIds || !Array.isArray(sourceIds) || sourceIds.length === 0) {
      return NextResponse.json(
        { error: 'At least one source must be specified' },
        { status: 400 }
      );
    }

    // Get source configurations
    const sources = sourceIds
      .map((id: string) => getSourceById(id))
      .filter((source): source is NonNullable<typeof source> => source !== undefined);

    if (sources.length === 0) {
      return NextResponse.json(
        { error: 'No valid sources found' },
        { status: 400 }
      );
    }

    // Perform parallel search across sources
    const searchResults = await searchVideos(query.trim(), sources, page);

    // Format response
    const response: SearchResult[] = searchResults.map(result => ({
      results: result.results,
      source: result.source,
      responseTime: result.responseTime,
      error: result.error,
    }));

    return NextResponse.json({
      success: true,
      query: query.trim(),
      page,
      sources: response,
      totalResults: response.reduce((sum, r) => sum + r.results.length, 0),
    });
  } catch (error) {
    console.error('Search API error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}

// Support GET method for simple queries
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q') || searchParams.get('query');
    const sourcesParam = searchParams.get('sources');
    const page = parseInt(searchParams.get('page') || '1', 10);

    if (!query) {
      return NextResponse.json(
        { error: 'Missing query parameter' },
        { status: 400 }
      );
    }

    // Use all enabled sources if not specified
    const sourceIds = sourcesParam
      ? sourcesParam.split(',')
      : getEnabledSources().map(s => s.id);

    // Get source configurations
    const sources = sourceIds
      .map((id: string) => getSourceById(id))
      .filter((source): source is NonNullable<typeof source> => source !== undefined);

    if (sources.length === 0) {
      return NextResponse.json(
        { error: 'No valid sources found' },
        { status: 400 }
      );
    }

    // Perform search
    const searchResults = await searchVideos(query.trim(), sources, page);

    // Format response
    const response: SearchResult[] = searchResults.map(result => ({
      results: result.results,
      source: result.source,
      responseTime: result.responseTime,
      error: result.error,
    }));

    return NextResponse.json({
      success: true,
      query: query.trim(),
      page,
      sources: response,
      totalResults: response.reduce((sum, r) => sum + r.results.length, 0),
    });
  } catch (error) {
    console.error('Search API error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
