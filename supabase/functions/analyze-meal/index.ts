// Plateful – "analyze-meal" Supabase Edge Function.
// Receives a meal photo from a signed-in user, asks Google Gemini (vision) to detect every visible ingredient,
// and returns structured JSON. The app then runs the measurement pipeline (area -> volume -> weight -> kcal) itself.
// The Gemini key stays here as a secret (GEMINI_API_KEY); it is never sent to the browser.
// Production equivalent: an Amazon SageMaker segmentation endpoint behind API Gateway (charter H8).

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

const prompt = (lang: string) => `You are the food-recognition module of a vision-based dietary assessment app. Analyse the meal photo and return ONLY JSON:
{"dish":string,"image_width_cm":number,"calibration_confidence":number,"not_visible_note":string,"items":[{"name":string,"bbox":[x,y,w,h],"coverage":number,"thickness_cm":number,"confidence":number,"density_g_cm3":number,"kcal_per_100g":number,"protein_g":number,"carbs_g":number,"fat_g":number}]}
Rules:
- List EVERY visually distinct ingredient separately (a salad becomes lettuce, tomato, carrot...). Max 12 items.
- "name": short common ENGLISH food name, e.g. "white rice", "cherry tomato", "kidney beans". "dish" and "not_visible_note" in ${lang === "fr" ? "French" : "English"}.
- bbox is normalised 0-1 relative to the full image (x,y = top-left corner, w,h = width,height).
- coverage = fraction (0-1) of the bbox area actually occupied by that food as seen from above.
- thickness_cm = average depth of that food. Assume what is visible on the surface continues uniformly to the bottom (for solids in soup, use the liquid depth).
- protein_g, carbs_g, fat_g are per 100 g.
- image_width_cm = real-world width the photo covers, auto-calibrated from scene geometry (plate/bowl/table proportions, perspective, typical phone distance). Never rely on coins, hands or cards.
- not_visible_note = short list of likely hidden items (oil, salt, butter, sauce) you cannot measure.
- If the image is not food, return {"dish":"not food","items":[]}.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);
  try {
    const key = Deno.env.get("GEMINI_API_KEY");
    if (!key) return json({ error: "missing_key" }, 500);

    const { image, mime, lang } = await req.json();
    if (typeof image !== "string" || image.length < 100 || image.length > 6_000_000) return json({ error: "bad_image" }, 400);
    const type = mime === "image/png" ? "image/png" : "image/jpeg";

    // Fastest model first; each model gets 20 s, then the next one is tried. "Thinking" is turned down for speed.
    const models = [Deno.env.get("GEMINI_MODEL"), "gemini-flash-lite-latest", "gemini-flash-latest", "gemini-2.5-flash"].filter(Boolean) as string[];
    const call = (model: string, thinking: boolean) =>
      fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
        method: "POST",
        signal: AbortSignal.timeout(20000),
        headers: { "Content-Type": "application/json", "x-goog-api-key": key },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt(lang) }, { inline_data: { mime_type: type, data: image } }] }],
          generationConfig: { responseMimeType: "application/json", temperature: 0.2, ...(thinking ? { thinkingConfig: { thinkingBudget: 0 } } : {}) },
        }),
      });
    let last = "";
    for (const model of models) {
      const t0 = Date.now();
      try {
        let r = await call(model, true);
        let body = await r.json().catch(() => ({}));
        if (r.status === 400 && /thinking/i.test(body?.error?.message || "")) { r = await call(model, false); body = await r.json().catch(() => ({})); }
        console.log(`${model}: HTTP ${r.status} in ${Date.now() - t0} ms`);
        if (r.status === 429) { last = `${model}: rate limited`; continue; }
        if (r.status === 400 && /api key/i.test(body?.error?.message || "")) return json({ error: "bad_key" }, 500);
        if (!r.ok) { last = `${model}: ${r.status} ${body?.error?.message || ""}`; console.log(last); continue; }
        const text = (body?.candidates?.[0]?.content?.parts || []).map((p: { text?: string }) => p.text || "").join("");
        try {
          const result = JSON.parse(text.replace(/^\s*```(?:json)?/i, "").replace(/```\s*$/, ""));
          return json({ model, ms: Date.now() - t0, result });
        } catch { last = `${model}: unreadable answer`; console.log(last); }
      } catch (e) { last = `${model}: ${String(e)} after ${Date.now() - t0} ms`; console.log(last); }
    }
    if (/rate limited/.test(last)) return json({ error: "rate_limited" }, 429);
    return json({ error: "model_error", detail: last }, 502);
  } catch (e) {
    return json({ error: "server_error", detail: String(e) }, 500);
  }
});
