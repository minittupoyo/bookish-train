interface Env {
    ASSETS: Fetcher;
    LISTENBRAINZ_TOKEN?: string;
}

const json = (body: unknown, status = 200) =>
    Response.json(body, {
        status,
        headers: {
            "Cache-Control": status === 200 ? "public, max-age=300" : "no-store",
        },
    });

const handleCoverArt = async (request: Request, env: Env) => {
    if (!env.LISTENBRAINZ_TOKEN) {
        return json({ error: "ListenBrainz token is not configured" }, 503);
    }

    const url = new URL(request.url);
    const artistName = url.searchParams.get("artist_name")?.trim();
    const recordingName = url.searchParams.get("recording_name")?.trim();
    const releaseName = url.searchParams.get("release_name")?.trim();

    if (!artistName || !recordingName) {
        return json({ error: "artist_name and recording_name are required" }, 400);
    }

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
    if (!metadata.release_mbid) return json({ cover_art_url: null });

    return json({
        cover_art_url: `https://coverartarchive.org/release/${encodeURIComponent(metadata.release_mbid)}/front-250.jpg`,
    });
};

export default {
    async fetch(request: Request, env: Env): Promise<Response> {
        const url = new URL(request.url);

        if (url.pathname === "/api/listenbrainz/cover-art") {
            if (request.method !== "GET") {
                return new Response("Method Not Allowed", { status: 405, headers: { Allow: "GET" } });
            }

            return handleCoverArt(request, env);
        }

        return env.ASSETS.fetch(request);
    },
};
