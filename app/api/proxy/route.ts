import { NextRequest, NextResponse } from 'next/server';

// Use Edge Runtime for better geographic distribution
export const runtime = 'edge';

export async function GET(request: NextRequest) {
    const url = request.nextUrl.searchParams.get('url');

    if (!url) {
        return new NextResponse('Missing URL parameter', { status: 400 });
    }

    try {
        // Beijing IP address to simulate request from China
        const chinaIP = '202.108.22.5';
        const urlObj = new URL(url);

        const response = await fetch(url, {
            headers: {
                // User agent
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',

                // IP-related headers (multiple formats for better compatibility)
                'X-Forwarded-For': chinaIP,
                'X-Real-IP': chinaIP,
                'Client-IP': chinaIP,
                'True-Client-IP': chinaIP,

                // Geographic/location headers
                'CF-IPCountry': 'CN',  // Cloudflare-style country code
                'X-Country-Code': 'CN',
                'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',

                // Standard browser headers
                'Accept': '*/*',
                'Accept-Encoding': 'gzip, deflate, br',
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache',

                // Referrer headers
                'Referer': urlObj.origin,
                'Origin': urlObj.origin,

                // Connection
                'Connection': 'keep-alive',
            },
        });

        // Log response status to help debug on Vercel
        console.log(`Proxy request to ${url} - Status: ${response.status} ${response.statusText}`);

        // Log warning for non-successful responses
        if (!response.ok) {
            console.warn(`Non-OK response: ${response.status} for URL: ${url}`);
        }

        const contentType = response.headers.get('Content-Type');

        // Handle m3u8 playlists: rewrite URLs to go through proxy
        if (contentType && (contentType.includes('application/vnd.apple.mpegurl') || contentType.includes('application/x-mpegurl') || url.endsWith('.m3u8'))) {
            const text = await response.text();
            const baseUrl = new URL(url);

            const modifiedText = text.split('\n').map(line => {
                // Skip comments and empty lines
                if (line.trim().startsWith('#') || !line.trim()) {
                    return line;
                }

                // Resolve relative URLs
                try {
                    const absoluteUrl = new URL(line.trim(), baseUrl).toString();
                    // Wrap in proxy
                    return `${request.nextUrl.origin}/api/proxy?url=${encodeURIComponent(absoluteUrl)}`;
                } catch (e) {
                    return line;
                }
            }).join('\n');

            return new NextResponse(modifiedText, {
                status: response.status,
                statusText: response.statusText,
                headers: {
                    'Content-Type': contentType,
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'GET, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
                },
            });
        }

        // For non-m3u8 content (segments, mp4, etc.), stream directly
        const newResponse = new NextResponse(response.body, {
            status: response.status,
            statusText: response.statusText,
            headers: new Headers(response.headers),
        });

        // Add CORS headers to allow playback
        newResponse.headers.set('Access-Control-Allow-Origin', '*');
        newResponse.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
        newResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

        return newResponse;
    } catch (error) {
        console.error('Proxy error:', error);
        console.error('Failed URL:', url);

        // Log detailed error information to help debug on Vercel
        if (error instanceof Error) {
            console.error('Error message:', error.message);
            console.error('Error stack:', error.stack);
        }

        return new NextResponse(
            JSON.stringify({
                error: 'Proxy request failed',
                message: error instanceof Error ? error.message : 'Unknown error',
                url: url
            }),
            {
                status: 500,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                }
            }
        );
    }
}

export async function OPTIONS(request: NextRequest) {
    return new NextResponse(null, {
        status: 204,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
    });
}
