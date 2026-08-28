interface AssetBinding {
    fetch(request: Request): Promise<Response>;
}

interface ExecutionContextLike {
    waitUntil(promise: Promise<unknown>): void;
}

interface Env {
    ASSETS: AssetBinding;
    LISTENBRAINZ_TOKEN?: string;
}

const json = (body: unknown, status = 200, cacheControl = "no-store") =>
    Response.json(body, {
        status,
        headers: { "Cache-Control": cacheControl },
    });

const getCached = async (request: Request) => {
    const cache = await caches.open("listenbrainz-api");
    return { cache, response: await cache.match(request) };
};

const handlePlayingNow = async (request: Request, context: ExecutionContextLike) => {
    const url = new URL(request.url);
    const username = url.searchParams.get("username")?.trim();
    if (!username) return json({ error: "username is required" }, 400);

    const cacheKey = new Request(url.toString(), { method: "GET" });
    const { cache, response: cached } = await getCached(cacheKey);
    if (cached) return cached;

    const response = await fetch(`https://api.listenbrainz.org/1/user/${encodeURIComponent(username)}/playing-now`, {
        headers: { Accept: "application/json" },
    });

    if (!response.ok) return json({ error: "ListenBrainz playing-now request failed" }, 502);

    const body = await response.text();
    const result = new Response(body, {
        headers: {
            "Content-Type": "application/json; charset=utf-8",
            "Cache-Control": "public, max-age=5, s-maxage=10",
        },
    });

    context.waitUntil(cache.put(cacheKey, result.clone()));
    return result;
};

const handleCoverArt = async (request: Request, env: Env, context: ExecutionContextLike) => {
    if (!env.LISTENBRAINZ_TOKEN) return json({ error: "ListenBrainz token is not configured" }, 503);

    const url = new URL(request.url);
    const artistName = url.searchParams.get("artist_name")?.trim();
    const recordingName = url.searchParams.get("recording_name")?.trim();
    const releaseName = url.searchParams.get("release_name")?.trim();

    if (!artistName || !recordingName) return json({ error: "artist_name and recording_name are required" }, 400);

    const cacheKey = new Request(url.toString(), { method: "GET" });
    const { cache, response: cached } = await getCached(cacheKey);
    if (cached) return cached;

    const lookupUrl = new URL("https://api.listenbrainz.org/1/metadata/lookup/");
    lookupUrl.searchParams.set("artist_name", artistName);
    lookupUrl.searchParams.set("recording_name", recordingName);
    if (releaseName) lookupUrl.searchParams.set("release_name", releaseName);

    const response = await fetch(lookupUrl, {
        headers: {
            Accept: "application/json",
            Authorization: `Token ${env.LISTENBRAINZ_TOKEN}`,
        },
    });

    if (!response.ok) {
        console.error("ListenBrainz metadata lookup failed", response.status);
        return json({ error: "Metadata lookup failed" }, 502);
    }

    const metadata = (await response.json()) as { release_mbid?: string | null };
    const result = json(
        {
            cover_art_url: metadata.release_mbid
                ? `https://coverartarchive.org/release/${encodeURIComponent(metadata.release_mbid)}/front-250.jpg`
                : null,
        },
        200,
        metadata.release_mbid ? "public, max-age=86400, s-maxage=604800" : "public, max-age=300, s-maxage=3600",
    );

    context.waitUntil(cache.put(cacheKey, result.clone()));
    return result;
};

export default {
    async fetch(request: Request, env: Env, context: ExecutionContextLike): Promise<Response> {
        const url = new URL(request.url);

        if (request.method === "GET" && url.pathname === "/api/listenbrainz/playing-now") {
            return handlePlayingNow(request, context);
        }

        if (url.pathname === "/api/listenbrainz/cover-art") {
            if (request.method !== "GET") return new Response("Method Not Allowed", { status: 405, headers: { Allow: "GET" } });
            return handleCoverArt(request, env, context);
        }

        return env.ASSETS.fetch(request);
    },
};
