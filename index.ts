// =====================================================
//  Blender Dashboard – Supabase Edge Function Proxy
//  Handles: Anthropic KI Search, YouTube API
//
//  Deploy mit:
//  supabase functions deploy proxy
// =====================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const ANTHROPIC_KEY = Deno.env.get("ANTHROPIC_API_KEY") ?? "";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: CORS });
  }

  try {
    const { action, payload } = await req.json();

    // ── KI IMAGE SEARCH ──────────────────────────────
    if (action === "image_search") {
      const { query } = payload;

      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": ANTHROPIC_KEY,
          "anthropic-version": "2023-06-01",
          "anthropic-beta": "web-search-2025-03-05",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 2000,
          tools: [{ type: "web_search_20250305", name: "web_search" }],
          messages: [{
            role: "user",
            content: `Search for high quality reference images for a 3D Blender scene: "${query}".
Find 12 real images from artstation.com, deviantart.com, pinterest.com, wallpaper sites.
Return ONLY a JSON array, no markdown. Format:
[{"title":"...","image_url":"direct URL ending in .jpg/.png/.webp","source_url":"page URL","site":"domain"}]
Only real direct image URLs.`
          }]
        })
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error.message);

      // Extract text from response
      const text = data.content
        .filter((b: any) => b.type === "text")
        .map((b: any) => b.text)
        .join("");

      // Parse JSON array from response
      const match = text.match(/\[[\s\S]*?\]/);
      if (!match) throw new Error("Keine Bilder gefunden");

      const images = JSON.parse(match[0]).filter((img: any) =>
        img.image_url && img.image_url.length > 10
      );

      return new Response(JSON.stringify({ ok: true, images }), {
        headers: { ...CORS, "Content-Type": "application/json" }
      });
    }

    // ── YOUTUBE VIEWS SYNC ───────────────────────────
    if (action === "youtube_sync") {
      const { video_ids, api_key } = payload;
      if (!video_ids?.length) throw new Error("Keine Video-IDs");

      const url = `https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${video_ids.join(",")}&key=${api_key}`;
      const resp = await fetch(url);
      const data = await resp.json();

      if (data.error) throw new Error(data.error.message);

      const stats: Record<string, number> = {};
      (data.items || []).forEach((item: any) => {
        stats[item.id] = parseInt(item.statistics?.viewCount || "0");
      });

      return new Response(JSON.stringify({ ok: true, stats }), {
        headers: { ...CORS, "Content-Type": "application/json" }
      });
    }

    throw new Error(`Unbekannte Aktion: ${action}`);

  } catch (e: any) {
    return new Response(
      JSON.stringify({ ok: false, error: e.message }),
      { status: 400, headers: { ...CORS, "Content-Type": "application/json" } }
    );
  }
});
