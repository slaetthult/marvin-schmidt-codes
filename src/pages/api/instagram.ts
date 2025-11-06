import type { APIRoute } from 'astro';

export const prerender = false;

const IG_FIELDS = [
    'id',
    'caption',
    'media_type',
    'media_url',
    'permalink',
    'thumbnail_url',
    'timestamp'
].join(',');

const SOURCE = `https://graph.instagram.com/me/media?fields=${IG_FIELDS}&access_token=${process.env.IG_ACCESS_TOKEN}`;

export const GET: APIRoute = async () => {
    try {
        const res = await fetch(SOURCE, { next: { revalidate: 3600 } });
        if (!res.ok) {
            return new Response(JSON.stringify({ error: 'instagram fetch failed' }), { status: 502 });
        }
        const json = await res.json();

        const items = (json.data || []).slice(0, 3).map((m: any) => ({
            id: m.id,
            type: m.media_type,
            src: m.media_url || m.thumbnail_url,
            alt: m.caption ?? '',
            url: m.permalink,
            ts: m.timestamp
        }));

        return new Response(JSON.stringify({ items }), {
            headers: {
                'content-type': 'application/json; charset=utf-8',
                'Cache-Control': 's-maxage=3600, stale-while-revalidate=86400'
            }
        });
    } catch (e) {
        return new Response(JSON.stringify({ error: 'unexpected error' }), { status: 500 });
    }
};
