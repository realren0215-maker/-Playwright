import "server-only";
import { NextResponse } from "next/server";

type OcrRequest = { image?: string; sectionId?: "menu" };

function getOutputText(payload: Record<string, unknown>) {
  const direct = payload.output_text;
  if (typeof direct === "string") return direct;
  const output = Array.isArray(payload.output) ? payload.output : [];
  for (const item of output) {
    if (!item || typeof item !== "object") continue;
    const content = Array.isArray((item as { content?: unknown[] }).content) ? (item as { content: unknown[] }).content : [];
    for (const part of content) {
      if (part && typeof part === "object" && typeof (part as { text?: unknown }).text === "string") return (part as { text: string }).text;
    }
  }
  return "";
}

export async function POST(request: Request) {
  // This route executes on the server. Never move this variable into client code
  // or rename it with a NEXT_PUBLIC_ prefix.
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) return NextResponse.json({ error: "OPENAI_API_KEY가 설정되지 않아 자동 번역을 사용할 수 없습니다." }, { status: 503 });

  try {
    const body = await request.json() as OcrRequest;
    if (!body.image || body.sectionId !== "menu") {
      return NextResponse.json({ error: "올바른 이미지와 섹션이 필요합니다." }, { status: 400 });
    }
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: process.env.OPENAI_OCR_MODEL || "gpt-5-mini",
        store: false,
        input: [{ role: "user", content: [
          { type: "input_text", text: "이 고덕지도 대표메뉴 캡처에서 보이는 중국어만 정확히 읽고 자연스러운 한국어로 번역하세요. 메뉴명과 설명을 첫 블록에, 가격과 상세정보를 둘째 블록에 담으세요. 가격은 원문 그대로 유지하고, 불확실한 고유명사는 원문을 병기하세요. 보이지 않는 내용은 절대 만들지 말고 빈 문자열로 반환하세요." },
          { type: "input_image", image_url: body.image, detail: "high" },
        ] }],
        text: { format: { type: "json_schema", name: "amap_ocr_translation", strict: true, schema: {
          type: "object", additionalProperties: false, properties: {
            blocks: { type: "array", items: { type: "object", additionalProperties: false, properties: { title: { type: "string" }, text: { type: "string" } }, required: ["title", "text"] } },
          }, required: ["blocks"]
        } } },
      }),
    });
    const payload = await response.json() as Record<string, unknown>;
    if (!response.ok) return NextResponse.json({ error: "이미지 인식 API가 요청을 처리하지 못했습니다." }, { status: 502 });
    const parsed = JSON.parse(getOutputText(payload) || "{\"blocks\":[]}");
    const blocks = Array.isArray(parsed.blocks) ? parsed.blocks.slice(0, 2).filter((block: unknown) => block && typeof block === "object") : [];
    return NextResponse.json({ blocks });
  } catch {
    return NextResponse.json({ error: "이미지 인식 또는 번역 중 오류가 발생했습니다." }, { status: 500 });
  }
}
