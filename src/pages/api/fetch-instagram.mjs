import fs from "node:fs/promises";
import * as dotenv from "dotenv";

dotenv.config();

const FIELDS = "id,caption,media_type,media_url,permalink,thumbnail_url,timestamp";

function sourceUrl() {

    const token = process.env.IG_ACCESS_TOKEN;
    if (!token) throw new Error("Missing IG_ACCESS_TOKEN");
    const userId = process.env.IG_USER_ID;

    return `https://graph.instagram.com/me/media?fields=${FIELDS}&access_token=${token}`;
}
console.log(sourceUrl());
const res = await fetch(sourceUrl());
if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Instagram fetch failed (${res.status}): ${text}`);
}
const json = await res.json();
const items = (json.data ?? []).slice(0, 12).map(m => ({
    id: m.id,
    type: m.media_type,
    src: m.media_url || m.thumbnail_url,
    alt: m.caption ?? "",
    url: m.permalink,
    ts: m.timestamp
}));

await fs.mkdir("src/data", { recursive: true });
await fs.writeFile("src/data/instagram.json", JSON.stringify({ items }, null, 2));
console.log("✅ Wrote src/data/instagram.json");