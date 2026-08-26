import { getCollection, type CollectionEntry } from "astro:content";

export async function getPosts(): Promise<CollectionEntry<"blog">[]> {
    return (await getCollection("blog", ({ data }) => (import.meta.env.PROD ? !data.draft : true))).sort(
        (a, b) => b.data.date.valueOf() - a.data.date.valueOf(),
    );
}
