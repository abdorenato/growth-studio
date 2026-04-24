import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("query") || "";
  const count = Number(searchParams.get("count") || "6");

  if (!query.trim()) {
    return NextResponse.json({ results: [] });
  }

  try {
    // Usa o endpoint público do Unsplash (sem API key)
    const resp = await fetch(
      `https://unsplash.com/napi/search/photos?query=${encodeURIComponent(
        query
      )}&per_page=${count}&orientation=portrait`
    );
    const data = await resp.json();

    type Photo = {
      id: string;
      urls?: { regular?: string; small?: string; full?: string };
      user?: { name?: string; links?: { html?: string } };
      alt_description?: string;
    };

    const results = (data.results || []).map((p: Photo) => ({
      id: p.id,
      url: p.urls?.regular || "",
      thumb: p.urls?.small || "",
      full: p.urls?.full || "",
      author: p.user?.name || "Unknown",
      author_url: p.user?.links?.html || "",
      alt: p.alt_description || query,
    }));

    return NextResponse.json({ results });
  } catch {
    // Fallback: URLs diretas do source.unsplash.com
    const results = Array.from({ length: count }).map((_, i) => ({
      id: `fallback_${i}`,
      url: `https://source.unsplash.com/1080x1350/?${encodeURIComponent(
        query
      )}&sig=${i}`,
      thumb: `https://source.unsplash.com/400x500/?${encodeURIComponent(
        query
      )}&sig=${i}`,
      full: `https://source.unsplash.com/1080x1350/?${encodeURIComponent(
        query
      )}&sig=${i}`,
      author: "Unsplash",
      author_url: "https://unsplash.com",
      alt: query,
    }));
    return NextResponse.json({ results });
  }
}
