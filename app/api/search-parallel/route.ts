/**
 * Parallel Streaming Search API Route
 * Searches all sources in parallel and streams results immediately as they arrive
 * No waiting - results flow in real-time
 */

import { NextRequest } from 'next/server';
import { searchVideos } from '@/lib/api/client';
import { getSourceById } from '@/lib/api/video-sources';

export async function POST(request: NextRequest) {
  const encoder = new TextEncoder();
  
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const body = await request.json();
        const { query, sources: sourceIds, page = 1 } = body;

        // Validate input
        if (!query || typeof query !== 'string' || query.trim().length === 0) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
            type: 'error', 
            message: 'Invalid query' 
          })}\n\n`));
          controller.close();
          return;
        }

        // Get source configurations
        const sources = sourceIds
          .map((id: string) => getSourceById(id))
          .filter((source: any): source is NonNullable<typeof source> => source !== undefined);

        if (sources.length === 0) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
            type: 'error', 
            message: 'No valid sources' 
          })}\n\n`));
          controller.close();
          return;
        }

        // Send initial status
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
          type: 'start',
          totalSources: sources.length
        })}\n\n`));

        console.log(`[Search Parallel] Starting search for "${query}" across ${sources.length} sources`);

        // Track progress
        let completedSources = 0;
        let totalVideosFound = 0;

        // Search all sources in PARALLEL - don't wait for all to finish
        const searchPromises = sources.map(async (source: any) => {
          const startTime = performance.now(); // Track start time
          try {
            console.log(`[Search Parallel] Searching source: ${source.id} (${getSourceDisplayName(source.id)})`);
            
            // Search this source
            const result = await searchVideos(query.trim(), [source], page);
            const endTime = performance.now(); // Track end time
            const latency = Math.round(endTime - startTime); // Calculate latency in ms
            const videos = result[0]?.results || [];
            
            completedSources++;
            totalVideosFound += videos.length;

            console.log(`[Search Parallel] Source ${source.id} completed in ${latency}ms: ${videos.length} videos found`);

            // Stream videos immediately as they arrive WITH latency data
            if (videos.length > 0) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
                type: 'videos',
                videos: videos.map((video: any) => ({
                  ...video,
                  sourceDisplayName: getSourceDisplayName(source.id),
                  latency, // Add latency to each video
                })),
                source: source.id,
                completedSources,
                totalSources: sources.length,
                latency, // Also include at source level
              })}\n\n`));
            }

            // Send progress update
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
              type: 'progress',
              completedSources,
              totalSources: sources.length,
              totalVideosFound
            })}\n\n`));

          } catch (error) {
            const endTime = performance.now();
            const latency = Math.round(endTime - startTime);
            // Log error but continue with other sources
            console.error(`[Search Parallel] Source ${source.id} failed after ${latency}ms:`, error);
            completedSources++;
            
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
              type: 'progress',
              completedSources,
              totalSources: sources.length,
              totalVideosFound
            })}\n\n`));
          }
        });

        // Wait for all sources to complete
        await Promise.all(searchPromises);

        console.log(`[Search Parallel] Search complete: ${totalVideosFound} total videos found from ${completedSources}/${sources.length} sources`);

        // Send completion signal
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
          type: 'complete',
          totalVideosFound,
          totalSources: sources.length
        })}\n\n`));

        controller.close();

      } catch (error) {
        console.error('Search error:', error);
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
          type: 'error',
          message: error instanceof Error ? error.message : 'Unknown error'
        })}\n\n`));
        controller.close();
      }
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}

/**
 * Get display name for source
 */
function getSourceDisplayName(sourceId: string): string {
  const sourceNames: Record<string, string> = {
    'dytt': '电影天堂',
    'ruyi': '如意',
    'baofeng': '暴风',
    'tianya': '天涯',
    'feifan': '非凡影视',
    'sanliuling': '360',
    'wolong': '卧龙',
    'jisu': '极速',
    'mozhua': '魔爪',
    'modu': '魔都',
    'zuida': '最大',
    'yinghua': '樱花',
    'baiduyun': '百度云',
    'wujin': '无尽',
    'wangwang': '旺旺',
    'ikun': 'iKun',
  };
  return sourceNames[sourceId] || sourceId;
}
