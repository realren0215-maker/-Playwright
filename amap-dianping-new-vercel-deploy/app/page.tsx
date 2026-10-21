"use client";

import { ChangeEvent, createContext, DragEvent, useContext, useMemo, useRef, useState } from "react";
import "./drag-drop.css";
import "./report-combo.css";
import { createReportPdf, downloadOrOpenPdf, isMobilePdfBrowser, safePdfFilename, showPdfError } from "./pdf-export";
import { ReportPlatform, ReportPlatformId, reportPlatforms } from "./report-platforms";

type Store = {
  name: string;
  chineseName: string;
  reportDate: string;
  status: string;
  cpcWeekday: string;
  cpcWeekend: string;
  cpcBid: string;
  cptExpiry: string;
};

type TranslationBlock = { title: string; text: string };
type TranslationStatus = "idle" | "processing" | "done" | "empty" | "error" | "unavailable";
type Shot = {
  id: string;
  url: string;
  name: string;
  label?: string;
  zoom: number;
  x: number;
  y: number;
  translationStatus?: TranslationStatus;
  translationError?: string;
  translations?: TranslationBlock[];
};
type Section = { id: string; number: string; title: string; description: string; shots: Shot[] };
type ReportEntry = { kind: "section"; section: Section } | { kind: "continuation"; section: Section; block: TranslationBlock; part: number };

const initialStore: Store = {
  name: "레디영약국 명동점",
  chineseName: "READY YOUNG 药局 明洞店",
  reportDate: "2026.10.06",
  status: "입점 완료",
  cpcWeekday: "",
  cpcWeekend: "",
  cpcBid: "",
  cptExpiry: "",
};

const baseSections: Section[] = [
  { id: "main", number: "01", title: "메인페이지", description: "고덕지도 매장 메인페이지 캡처", shots: [] },
  { id: "detail", number: "02", title: "매장 상세정보", description: "고덕지도 매장 상세정보 캡처", shots: [] },
  { id: "entry1", number: "03", title: "매장 앨범 + 대표메뉴", description: "매장 앨범 · 대표메뉴 캡처", shots: [] },
  { id: "entry2", number: "04", title: "영업정보 + 브랜드스토리", description: "영업정보 · 브랜드스토리 캡처", shots: [] },
  { id: "gallery", number: "05", title: "매장 앨범", description: "매장 앨범 캡처", shots: [] },
  { id: "product", number: "06", title: "대표상품정보", description: "대표상품정보 캡처", shots: [] },
  { id: "other", number: "07", title: "기타", description: "추가 기능 및 콘텐츠 캡처", shots: [] },
];

const screenTypeOptions: Record<string, string[]> = {
  detail: ["메인페이지", "매장 앨범", "대표메뉴", "브랜드스토리"],
  main: ["메인페이지"],
  entry1: ["매장 앨범", "대표메뉴"],
  entry2: ["영업정보", "브랜드스토리"],
  gallery: ["매장 앨범"],
  product: ["대표상품정보"],
};

const PlatformContext = createContext<ReportPlatform>(reportPlatforms.amap);

function PlatformMark({ compact = false }: { compact?: boolean }) {
  const platform = useContext(PlatformContext);
  return <div className={`brand ${compact ? "compact" : ""}`}>
    {platform.id === "dianping" ? <span className="dianping-brand-pair"><img src="/dianping/meituan-logo.jpg" alt="美团" /><img src="/dianping/logo.png" alt="大众点评" /></span> : <span className="mark">{platform.mark}</span>}
    <span>{platform.id === "dianping" ? "美团 · 大众点评" : platform.nativeName}</span>{!compact && <em>{platform.shortName} REPORT</em>}
  </div>;
}

function DianpingPageAccent({ section = false }: { section?: boolean }) {
  const platform = useContext(PlatformContext);
  if (platform.id !== "dianping") return null;
  return <div className={`dianping-page-accent ${section ? "section-accent" : ""}`} aria-hidden="true">
    {section && <img src="/dianping/character.jpg" alt="" />}
    <span /><i /><b>FOOD · SHOPPING · LEISURE</b>
  </div>;
}

function PhoneMockup({ shot, large = false }: { shot?: Shot; large?: boolean }) {
  return (
    <div className={`phone ${large ? "large" : ""}`}>
      <div className="phone-speaker" />
      <div className="phone-screen">
        {shot ? <img src={shot.url} alt={shot.name} /> : (
          <div className="phone-empty"><span>+</span><small>캡처 이미지</small></div>
        )}
      </div>
    </div>
  );
}

function chunkText(text: string, limit: number) {
  const clean = text.trim();
  if (!clean) return [];
  const chunks: string[] = [];
  let rest = clean;
  while (rest.length > limit) {
    let cut = Math.max(rest.lastIndexOf("\n", limit), rest.lastIndexOf(". ", limit), rest.lastIndexOf("다. ", limit));
    if (cut < limit * .55) cut = limit;
    else cut += rest.slice(cut, cut + 2).startsWith("다.") ? 2 : 1;
    chunks.push(rest.slice(0, cut).trim());
    rest = rest.slice(cut).trim();
  }
  if (rest) chunks.push(rest);
  return chunks;
}

function storyOverflow(section: Section) {
  const blocks = section.shots[0]?.translations || [];
  return blocks.flatMap(block => {
    const chunks = chunkText(block.text, 360);
    return chunks.slice(1).map((text, index) => ({ title: block.title, text, part: index + 2 }));
  });
}

function ReportCover({ store }: { store: Store }) {
  const platform = useContext(PlatformContext);
  return <article className="report-page cover-page">
    <div className="map-grid" /><div className="route route-a" /><div className="route route-b" />
    <div className="cover-pin"><span /></div>
    {platform.id === "dianping" && <div className="dianping-cover-visual" aria-hidden="true">
      <div className="dianping-lifestyle"><img src="/dianping/lifestyle.png" alt="" /></div>
      <div className="dianping-visual-shade" />
      <div className="dianping-cover-character"><img src="/dianping/character.jpg" alt="" /></div>
      <div className="dianping-lifestyle-label"><span>FOOD</span><i /> <span>SHOPPING</span><i /> <span>LEISURE</span></div>
    </div>}
    <PlatformMark />
    <div className="cover-copy">
      <span className="eyebrow">{platform.coverEyebrow}</span>
      <h1>{platform.name}<br /><b>입점 완료 보고서</b></h1>
      <p>{platform.coverSubtitle}</p>
    </div>
    <dl className="cover-meta">
      <div><dt>매장명</dt><dd>{store.name || "매장명을 입력해주세요"}</dd></div>
      <div><dt>중문 매장명</dt><dd>{store.chineseName || "—"}</dd></div>
      <div><dt>입점 상태</dt><dd><span className="status-dot" />{store.status}</dd></div>
      <div><dt>보고 일자</dt><dd>{store.reportDate}</dd></div>
    </dl>
    <div className="page-foot"><span>{platform.reportCode}</span><b>01</b></div>
  </article>;
}

function ReportHeader({ pageNumber }: { pageNumber: number }) {
  return <header className="report-head"><PlatformMark compact /><div className="report-count">{String(pageNumber).padStart(2, "0")}</div></header>;
}

function ReportFooter({ store, pageNumber }: { store: Store; pageNumber: number }) {
  const platform = useContext(PlatformContext);
  return <div className="page-foot"><span>{platform.shortName} · {store.name}</span><b>{String(pageNumber).padStart(2, "0")}</b></div>;
}

function StoreDetailPage({ store, pageNumber }: { store: Store; pageNumber: number }) {
  const platform = useContext(PlatformContext);
  return <article className="report-page store-detail-page">
    <ReportHeader pageNumber={pageNumber} />
    <div className="section-heading"><span>02</span><div><h2>매장 상세정보</h2><p>{platform.name}에 등록된 매장 기본정보입니다.</p></div></div>
    <div className="store-detail-card">
      <div className="store-detail-title"><span>STORE INFORMATION</span><b>{store.status}</b><h3>{store.name}</h3><p>{store.chineseName}</p></div>
      <dl>
        <div><dt>보고 일자</dt><dd>{store.reportDate}</dd></div>
        <div><dt>입점 상태</dt><dd>{store.status}</dd></div>
      </dl>
    </div>
    <ReportFooter store={store} pageNumber={pageNumber} />
  </article>;
}

function StoreDetailCapturePage({ section, store, pageNumber }: { section: Section; store: Store; pageNumber: number }) {
  return <article className="report-page detail-capture-page">
    <ReportHeader pageNumber={pageNumber} />
    <DianpingPageAccent />
    <div className="section-heading"><span>02</span><div><h2>매장 상세정보</h2></div></div>
    <div className={`typed-capture-grid count-${Math.min(section.shots.length, 6)}`}>{section.shots.slice(0, 6).map(shot => <div className="typed-capture" key={shot.id}><PhoneMockup shot={shot} large /><span>{shot.label || "메인페이지"}</span></div>)}</div>
    <ReportFooter store={store} pageNumber={pageNumber} />
  </article>;
}

function EntryCapturePage({ section, store, pageNumber }: { section: Section; store: Store; pageNumber: number }) {
  const hasBrandStory = section.id === "entry2" && section.shots.some(shot => shot.label === "브랜드스토리");
  return <article className="report-page entry-capture-page">
    <ReportHeader pageNumber={pageNumber} />
    <DianpingPageAccent section />
    <div className="section-heading"><span>{section.number}</span><div><h2>{section.title}</h2></div></div>
    <div className={`typed-capture-grid entry-grid count-${Math.min(section.shots.length, 6)} ${hasBrandStory ? "has-story-note" : ""}`}>
      {section.shots.slice(0, 6).map(shot => <div className="typed-capture" key={shot.id}><PhoneMockup shot={shot} large /><span>{shot.label || screenTypeOptions[section.id][0]}</span></div>)}
      {hasBrandStory && <aside className="story-note-card"><span>BRAND STORY</span><p>입점 초기 전달주신 정보를<br />중국어로 번역하여<br />기입한 내용</p></aside>}
    </div>
    <ReportFooter store={store} pageNumber={pageNumber} />
  </article>;
}

function MainPageReport({ section, store, pageNumber }: { section: Section; store: Store; pageNumber: number }) {
  const hasDailyBudget = Boolean(store.cpcWeekday.trim() || store.cpcWeekend.trim());
  const hasAds = Boolean(hasDailyBudget || store.cpcBid.trim() || store.cptExpiry.trim());
  return <article className="report-page main-page-report">
    <ReportHeader pageNumber={pageNumber} />
    <DianpingPageAccent />
    <div className="section-heading"><span>01</span><div><h2>메인페이지</h2></div></div>
    <div className="main-report-grid">
      <div className="main-report-phone"><PhoneMockup shot={section.shots[0]} large /><span>메인페이지</span></div>
      <div className="main-store-info">
        <span>STORE INFORMATION</span><b>{store.status}</b>
        <h3>{store.name}</h3><p>{store.chineseName}</p>
        {hasAds && <div className="report-ad-info">
          <span>AD INFORMATION</span>
          {hasDailyBudget && <div><b>CPC 일예산</b><p>{store.cpcWeekday.trim() && <em>평일 <strong>{store.cpcWeekday} 위안</strong></em>}{store.cpcWeekend.trim() && <em>주말 <strong>{store.cpcWeekend} 위안</strong></em>}</p></div>}
          {store.cpcBid.trim() && <div><b>CPC 입찰가</b><p><strong>{store.cpcBid} 위안</strong></p></div>}
          {store.cptExpiry.trim() && <div><b>CPT 만기일</b><p><strong>{store.cptExpiry}</strong></p></div>}
        </div>}
      </div>
    </div>
    <ReportFooter store={store} pageNumber={pageNumber} />
  </article>;
}

function CaptureGroup({ section, brandNotice = false }: { section: Section; brandNotice?: boolean }) {
  return <section className="capture-group">
    <div className="capture-group-head"><span>{section.number}</span><h3>{section.title}</h3></div>
    {brandNotice && <p className="brand-fixed-notice">입점 초기 전달주신 정보를 중국어로 번역하여 기입한 내용</p>}
    <div className={`capture-group-images count-${Math.min(section.shots.length, 2)}`}>{section.shots.slice(0, 2).map(shot => <PhoneMockup key={shot.id} shot={shot} large />)}</div>
  </section>;
}

function CombinedCapturePage({ first, second, title, store, pageNumber, storyNotice = false }: { first: Section; second: Section; title: string; store: Store; pageNumber: number; storyNotice?: boolean }) {
  const available = [first, second].filter(section => section.shots.length > 0);
  return <article className={`report-page combined-page groups-${available.length}`}>
    <ReportHeader pageNumber={pageNumber} />
    <div className="section-heading"><span>{String(pageNumber).padStart(2, "0")}</span><div><h2>{title}</h2></div></div>
    <div className="combined-grid">{available.map(section => <CaptureGroup key={section.id} section={section} brandNotice={storyNotice && section.id === "story"} />)}</div>
    <ReportFooter store={store} pageNumber={pageNumber} />
  </article>;
}

function OtherPage({ section, store, pageNumber }: { section: Section; store: Store; pageNumber: number }) {
  return <article className="report-page other-page">
    <ReportHeader pageNumber={pageNumber} />
    <DianpingPageAccent section />
    <div className="section-heading"><span>{section.number}</span><div><h2>기타</h2></div></div>
    <div className={`other-capture-grid count-${Math.min(section.shots.length, 4)}`}>{section.shots.slice(0, 4).map(shot => <div className="other-shot" key={shot.id}><PhoneMockup shot={shot} large /><span>{shot.label || "추가 콘텐츠"}</span></div>)}</div>
    <ReportFooter store={store} pageNumber={pageNumber} />
  </article>;
}

function EndingPage({ store, pageNumber }: { store: Store; pageNumber: number }) {
  const platform = useContext(PlatformContext);
  if (platform.id === "dianping") return <article className="report-page ending-page dianping-ending-page">
    <PlatformMark compact />
    <div className="dianping-ending-character"><img src="/dianping/character.jpg" alt="" /></div>
    <div className="dianping-ending-copy"><span>MEITUAN · DIANPING</span><h2>감사합니다</h2><i /></div>
  </article>;
  return <article className="report-page ending-page"><div className="ending-map-grid" /><h2>감사합니다</h2></article>;
}

function CaptureInsightLayout({ section }: { section: Section }) {
  const isMenu = section.id === "menu";
  const lead = section.shots[0];
  const guide = isMenu
    ? {
        kicker: "MENU INFORMATION",
        title: "대표메뉴 안내",
        copy: "고객이 고덕지도에서 매장의 주요 메뉴 정보를 확인할 수 있는 영역입니다.",
        items: ["메뉴 이미지", "메뉴명", "가격"],
        crops: ["대표메뉴", "메뉴명 · 가격", "메뉴 상세정보"],
      }
    : {
        kicker: "BRAND CONTENT",
        title: "브랜드스토리 안내",
        copy: "매장의 브랜드 소개와 스토리를 고객에게 전달하는 영역입니다.",
        items: ["브랜드 소개", "매장 스토리", "브랜드 특징"],
        crops: ["브랜드 대표 이미지", "브랜드 스토리", "관련 이미지"],
      };
  const positions = isMenu ? ["center 23%", "center 50%", "center 75%"] : ["center 18%", "center 48%", "center 78%"];
  const storyTranslations = (lead?.translations || []).filter(block => block.text?.trim()).map(block => ({ ...block, text: chunkText(block.text, 360)[0] || "" }));

  return <div className="insight-layout">
    <aside className="insight-guide">
      <span className="insight-kicker">{guide.kicker}</span>
      <h3>{guide.title}</h3>
      <p>{guide.copy}</p>
      <div className="guide-rule" />
      <ul>{guide.items.map((item, i) => <li key={item}><b>0{i + 1}</b><span>{item}</span></li>)}</ul>
      <small>업로드한 실제 캡처에서 확인되는 정보만 표시합니다.</small>
    </aside>
    <div className="connector connector-left"><i /></div>
    <div className="insight-phone"><PhoneMockup shot={lead} large /><span>{section.title} 캡처</span></div>
    <div className="connector connector-right"><i /></div>
    {isMenu ? <aside className="crop-column crops-2">
      {guide.crops.slice(0, 2).map((label, i) => {
        const source = lead;
        if (!source) return null;
        const translated = lead.translations?.[i]?.text?.trim();
        return <div className="crop-card" key={label}>
          <div className="crop-image"><img src={source.url} alt={`${section.title} 실제 캡처 ${label}`} style={{ objectPosition: positions[i] }} /></div>
          <div className="crop-copy"><b>{label}</b>{translated && <><span>한국어 번역</span><p>{translated}</p></>}</div>
        </div>;
      })}
    </aside> : <aside className={`story-translation-column cards-${Math.min(storyTranslations.length, 3)}`}>
      {storyTranslations.map((block, i) => <div className="story-translation-card" key={`${block.title}-${i}`}>
        <span>{block.title || (["브랜드 대표 문구", "브랜드 소개 · 스토리", "브랜드 특징"][i])}</span>
        <p>{block.text}</p>
      </div>)}
    </aside>}
  </div>;
}

function StoryTranslationContinuation({ section, block, part, pageNumber }: { section: Section; block: TranslationBlock; part: number; pageNumber: number }) {
  const platform = useContext(PlatformContext);
  return <article className="report-page translation-continuation-page">
    <header className="report-head"><PlatformMark compact /><div className="report-count">{String(pageNumber).padStart(2, "0")}</div></header>
    <div className="section-heading"><span>{section.number}</span><div><h2>브랜드스토리 번역</h2><p>업로드한 실제 {platform.name} 캡처에서 인식한 한국어 번역입니다.</p></div></div>
    <div className="continuation-card"><span>{block.title} · 계속</span><p>{block.text}</p><small>원본 캡처 기반 번역 · {part}페이지</small></div>
    <div className="page-foot"><span>{platform.shortName} · BRAND STORY TRANSLATION</span><b>{String(pageNumber).padStart(2, "0")}</b></div>
  </article>;
}

function ReportSection({ section, store, index }: { section: Section; store: Store; index: number }) {
  const platform = useContext(PlatformContext);
  const isMain = section.id === "main";
  const isInsight = section.id === "menu" || section.id === "story";
  return <article className="report-page section-page">
    <header className="report-head"><PlatformMark compact /><div className="report-count">{String(index + 2).padStart(2, "0")}</div></header>
    <div className="section-heading"><span>{section.number}</span><div><h2>{section.title}</h2><p>{section.description}</p></div></div>
    {isMain ? <div className="main-layout">
      <PhoneMockup shot={section.shots[0]} large />
      <div className="info-panel">
        <div className="info-top"><span>STORE INFORMATION</span><b>{store.status}</b></div>
        <h3>{store.name}</h3><p className="chinese">{store.chineseName}</p>
        <dl>
        </dl>
        <div className="verified">✓ {platform.verifiedLabel}</div>
      </div>
    </div> : isInsight ? <CaptureInsightLayout section={section} /> : <div className={`shot-grid count-${Math.min(section.shots.length, 4)}`}>
      {section.shots.map((shot) => <div className="shot-wrap" key={shot.id}><PhoneMockup shot={shot} /><span>{shot.label || section.title}</span></div>)}
    </div>}
    <div className="page-foot"><span>{platform.shortName} · {store.name}</span><b>{String(index + 2).padStart(2, "0")}</b></div>
  </article>;
}

export default function Home() {
  const [platformId, setPlatformId] = useState<ReportPlatformId>("amap");
  const platform = reportPlatforms[platformId];
  const [store, setStore] = useState(initialStore);
  const [sections, setSections] = useState(baseSections);
  const [active, setActive] = useState("main");
  const [view, setView] = useState<"editor" | "reports">("editor");
  const [previewMode, setPreviewMode] = useState(false);
  const [mobilePane, setMobilePane] = useState<"edit" | "preview">("edit");
  const [isUploadDragging, setIsUploadDragging] = useState(false);
  const [isCreatingPdf, setIsCreatingPdf] = useState(false);
  const dragIndex = useRef<number | null>(null);
  const uploadDragDepth = useRef(0);
  const visibleSections = useMemo(() => sections.filter(s => s.shots.length > 0), [sections]);
  const sectionsById = useMemo(() => Object.fromEntries(sections.map(section => [section.id, section])) as Record<string, Section>, [sections]);
  const reportPageIds = useMemo(() => {
    const pages: string[] = [];
    if (sectionsById.main.shots.length) pages.push("main");
    if (sectionsById.detail.shots.length) pages.push("detail");
    if (sectionsById.entry1.shots.length) pages.push("entry1");
    if (sectionsById.entry2.shots.length) pages.push("entry2");
    if (sectionsById.gallery.shots.length) pages.push("gallery");
    if (sectionsById.product.shots.length) pages.push("product");
    if (sectionsById.other.shots.length) pages.push("other");
    pages.push("ending");
    return pages;
  }, [sectionsById]);
  const activeSection = sections.find(s => s.id === active)!;

  const updateStore = (key: keyof Store, value: string) => setStore(prev => ({ ...prev, [key]: value }));
  const updateShot = (sectionId: string, shotId: string, patch: Partial<Shot>) => setSections(prev => prev.map(s => s.id === sectionId ? { ...s, shots: s.shots.map(x => x.id === shotId ? { ...x, ...patch } : x) } : s));
  const readImage = (file: File) => new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("이미지를 읽지 못했습니다."));
    reader.readAsDataURL(file);
  });
  const runTranslation = async (sectionId: string, shot: Shot) => {
    updateShot(sectionId, shot.id, { translationStatus: "processing", translationError: undefined });
    try {
      const response = await fetch("/api/ocr-translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: shot.url, sectionId }),
      });
      const data = await response.json();
      if (response.status === 503) {
        updateShot(sectionId, shot.id, { translationStatus: "unavailable", translationError: data.error || "번역 API가 설정되지 않았습니다." });
        return;
      }
      if (!response.ok) throw new Error(data.error || "번역 처리에 실패했습니다.");
      const blocks = Array.isArray(data.blocks) ? data.blocks.slice(0, sectionId === "story" ? 3 : 2) : [];
      updateShot(sectionId, shot.id, { translations: blocks, translationStatus: blocks.some((b: TranslationBlock) => b.text?.trim()) ? "done" : "empty" });
    } catch (error) {
      updateShot(sectionId, shot.id, { translationStatus: "error", translationError: error instanceof Error ? error.message : "번역 처리에 실패했습니다." });
    }
  };
  const addImageFiles = async (fileList: FileList | File[], sectionId: string) => {
    const files = Array.from(fileList).filter(file => file.type.startsWith("image/"));
    if (!files.length) return;
    const added: Shot[] = await Promise.all(files.map(async file => ({ id: crypto.randomUUID(), url: await readImage(file), name: file.name, label: sectionId === "other" ? "추가 콘텐츠" : screenTypeOptions[sectionId]?.[0], zoom: 1, x: 0, y: 0, translationStatus: "idle" as TranslationStatus })));
    setSections(prev => prev.map(s => s.id === sectionId ? { ...s, shots: [...s.shots, ...added] } : s));
  };
  const upload = async (e: ChangeEvent<HTMLInputElement>, sectionId: string) => {
    await addImageFiles(e.target.files || [], sectionId);
    e.target.value = "";
  };
  const enterUploadDropzone = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    uploadDragDepth.current += 1;
    setIsUploadDragging(true);
  };
  const leaveUploadDropzone = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    uploadDragDepth.current = Math.max(0, uploadDragDepth.current - 1);
    if (uploadDragDepth.current === 0) setIsUploadDragging(false);
  };
  const dropImages = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    uploadDragDepth.current = 0;
    setIsUploadDragging(false);
    void addImageFiles(e.dataTransfer.files, active);
  };
  const updateTranslation = (sectionId: string, shot: Shot, index: number, text: string) => {
    const defaults = sectionId === "menu" ? ["대표메뉴", "메뉴명 · 가격"] : ["브랜드 대표 이미지", "브랜드 스토리"];
    const blocks = [...(shot.translations || [])];
    const targetLength = sectionId === "story" ? 3 : 2;
    const storyDefaults = ["브랜드 대표 문구", "브랜드 소개 · 스토리", "브랜드 특징"];
    while (blocks.length < targetLength) blocks.push({ title: sectionId === "story" ? storyDefaults[blocks.length] : defaults[blocks.length], text: "" });
    blocks[index] = { ...blocks[index], text };
    updateShot(sectionId, shot.id, { translations: blocks, translationStatus: text.trim() || blocks.some((b, i) => i !== index && b.text.trim()) ? "done" : "empty" });
  };
  const removeShot = (sectionId: string, shotId: string) => setSections(prev => prev.map(s => s.id === sectionId ? { ...s, shots: s.shots.filter(x => x.id !== shotId) } : s));
  const moveShot = (sectionId: string, shotId: string, direction: -1 | 1) => setSections(prev => prev.map(section => {
    if (section.id !== sectionId) return section;
    const index = section.shots.findIndex(shot => shot.id === shotId);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= section.shots.length) return section;
    const shots = [...section.shots];
    [shots[index], shots[target]] = [shots[target], shots[index]];
    return { ...section, shots };
  }));
  const reorder = (target: number) => { if (dragIndex.current === null || dragIndex.current === target) return; setSections(prev => { const next = [...prev]; const [moved] = next.splice(dragIndex.current!, 1); next.splice(target, 0, moved); return next; }); dragIndex.current = null; };
  const printReport = async () => {
    if (isCreatingPdf) return;
    const reservedWindow = isMobilePdfBrowser() ? window.open("", "_blank") : null;
    if (reservedWindow) {
      reservedWindow.document.write('<main style="font-family:Arial,sans-serif;padding:32px;color:#182338"><h1 style="font-size:20px">PDF를 생성하고 있습니다</h1><p>보고서 페이지를 처리하는 동안 잠시 기다려주세요.</p></main>');
      reservedWindow.document.close();
    }
    setIsCreatingPdf(true);
    setPreviewMode(true);
    try {
      await new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
      const pages = Array.from(document.querySelectorAll<HTMLElement>(".report-stack .report-page"));
      const blob = await createReportPdf(pages);
      await downloadOrOpenPdf(blob, safePdfFilename(store.name, store.reportDate, platform.name), reservedWindow);
    } catch (error) {
      const message = error instanceof Error ? error.message : "PDF 생성 중 오류가 발생했습니다.";
      showPdfError(reservedWindow, message);
      window.alert(`PDF 생성에 실패했습니다. ${message}`);
    } finally {
      setIsCreatingPdf(false);
    }
  };

  return <PlatformContext.Provider value={platform}><main className={`${previewMode ? "previewing " : ""}platform-${platformId}`}>
    <header className="topbar">
      <PlatformMark />
      <nav><button className={view === "reports" ? "active" : ""} onClick={() => setView("reports")}>보고서 관리</button><button className={view === "editor" ? "active" : ""} onClick={() => setView("editor")}>새 보고서</button></nav>
      <div className="top-actions"><button className="ghost" onClick={() => setPreviewMode(!previewMode)}>{previewMode ? "편집으로" : "전체 미리보기"}</button><button className="primary" onClick={printReport} disabled={isCreatingPdf} aria-busy={isCreatingPdf}>{isCreatingPdf ? "PDF 생성 중…" : "PDF 보고서 생성"}</button></div>
    </header>

    {view === "reports" ? <section className="reports-view">
      <div className="reports-title"><div><span>REPORT LIBRARY</span><h1>보고서 관리</h1><p>생성한 입점 보고서를 한곳에서 관리하세요.</p></div><button className="primary" onClick={() => setView("editor")}>＋ 새 보고서</button></div>
      <div className="summary-row"><div><b>1</b><span>전체 보고서</span></div><div><b className="blue">1</b><span>입점 완료</span></div><div><b>0</b><span>작성 중</span></div></div>
      <div className="report-table"><div className="table-head"><span>매장명</span><span>생성일</span><span>입점 상태</span><span>마지막 수정</span><span>관리</span></div><div className="table-row"><span><strong>{store.name}</strong><small>{store.chineseName}</small></span><span>2026.10.06</span><span><i>●</i> {store.status}</span><span>방금 전</span><span className="row-actions"><button onClick={() => setView("editor")}>수정</button><button onClick={() => setPreviewMode(true)}>미리보기</button><button onClick={() => { setStore({ ...store, name: `${store.name} 복사본` }); setView("editor"); }}>복제</button><button onClick={printReport} disabled={isCreatingPdf}>{isCreatingPdf ? "생성 중…" : "PDF"}</button></span></div></div>
    </section> : <>
      {!previewMode && <div className="mobile-workflow-nav" aria-label="모바일 작업 화면 전환">
        <button className={mobilePane === "edit" ? "active" : ""} onClick={() => setMobilePane("edit")} aria-pressed={mobilePane === "edit"}>정보 입력</button>
        <button className={mobilePane === "preview" ? "active" : ""} onClick={() => setMobilePane("preview")} aria-pressed={mobilePane === "preview"}>보고서 미리보기</button>
      </div>}
      <div className={`workspace ${previewMode ? "full-preview" : ""} mobile-pane-${mobilePane}`}>
      {!previewMode && <aside className="editor">
        <div className="editor-title"><div><span>NEW REPORT</span><h1>입점 보고서 생성</h1></div><span className="autosave">● 자동 저장</span></div>
        <section className="form-section platform-section"><div className="form-heading"><b>1</b><div><h2>플랫폼 선택</h2><p>입력 항목과 기능은 동일하며 보고서 디자인만 달라집니다.</p></div></div>
          <div className="platform-options" role="radiogroup" aria-label="보고서 플랫폼 선택">
            {(Object.values(reportPlatforms) as ReportPlatform[]).map(option => <button type="button" role="radio" aria-checked={platformId === option.id} className={platformId === option.id ? "active" : ""} onClick={() => setPlatformId(option.id)} key={option.id}><span className={`platform-option-mark ${option.id === "dianping" ? "dianping-option-mark" : ""}`}>{option.id === "dianping" ? <img src="/dianping/logo.png" alt="" /> : option.mark}</span><span><b>{option.name}</b><small>{option.nativeName} · {option.shortName}</small></span><i>{platformId === option.id ? "✓" : ""}</i></button>)}
          </div>
        </section>
        <section className="form-section"><div className="form-heading"><b>2</b><div><h2>매장 기본정보</h2><p>보고서 표지와 매장 정보에 표시됩니다.</p></div></div>
          <div className="fields">
            {([['name','매장명'],['chineseName','중문 매장명'],['reportDate','보고일자']] as [keyof Store,string][]).map(([key,label]) => <label key={key}><span>{label}</span><input value={store[key]} onChange={e => updateStore(key,e.target.value)} /></label>)}
            <label><span>입점 상태</span><select value={store.status} onChange={e => updateStore('status',e.target.value)}><option>입점 완료</option><option>검수 중</option><option>수정 필요</option></select></label>
          </div>
          <div className="report-ad-fields">
            <div className="ad-fields-head"><span>AD INFORMATION</span><h3>광고정보</h3><p>사용하지 않는 CPC·CPT 항목은 비워두면 보고서에서 자동으로 숨겨집니다.</p></div>
            <div className="fields">
              <label><span>CPC 일예산 · 평일</span><div className="unit-input"><input inputMode="decimal" value={store.cpcWeekday} onChange={e => updateStore('cpcWeekday',e.target.value)} placeholder="금액 입력" /><i>위안</i></div></label>
              <label><span>CPC 일예산 · 주말</span><div className="unit-input"><input inputMode="decimal" value={store.cpcWeekend} onChange={e => updateStore('cpcWeekend',e.target.value)} placeholder="금액 입력" /><i>위안</i></div></label>
              <label><span>CPC 입찰가</span><div className="unit-input"><input inputMode="decimal" value={store.cpcBid} onChange={e => updateStore('cpcBid',e.target.value)} placeholder="금액 입력" /><i>위안</i></div></label>
              <label><span>CPT 만기일</span><input value={store.cptExpiry} onChange={e => updateStore('cptExpiry',e.target.value)} placeholder="YYYY.MM.DD" /></label>
            </div>
          </div>
        </section>
        <section className="form-section"><div className="form-heading"><b>3</b><div><h2>캡처 이미지</h2><p>이미지가 없는 섹션은 보고서에서 자동 제외됩니다.</p></div></div>
          <div className="section-tabs">{sections.map((s,i) => <button key={s.id} draggable onDragStart={() => dragIndex.current = i} onDragOver={(e:DragEvent) => e.preventDefault()} onDrop={() => reorder(i)} onClick={() => setActive(s.id)} className={active === s.id ? "active" : ""}><span className="drag">⠿</span><b>{s.number}</b>{s.title}<i>{s.shots.length}</i></button>)}</div>
          <div className={`uploader ${isUploadDragging ? "is-dragging" : ""}`} onDragEnter={enterUploadDropzone} onDragOver={e => { e.preventDefault(); e.dataTransfer.dropEffect = "copy"; }} onDragLeave={leaveUploadDropzone} onDrop={dropImages}><div><span className="upload-icon">⇧</span><h3>{isUploadDragging ? "여기에 놓아 업로드" : `${activeSection.title} 캡처를 드래그해 주세요`}</h3><p>PNG, JPG · 여러 장을 한 번에 선택할 수 있습니다</p><label className="upload-btn">이미지 선택<input aria-label={`${activeSection.title} 이미지 선택`} type="file" accept="image/*" multiple onChange={e => upload(e, active)} /></label></div></div>
          {activeSection.shots.length > 0 && <div className="shot-list">{activeSection.shots.map((shot, idx) => <div className="shot-edit" key={shot.id}><img src={shot.url} alt="" /><div className="shot-controls"><strong>{idx + 1}. {shot.name}</strong>{active === "other" ? <label className="screen-type-label"><span>이미지 문구</span><input value={shot.label || ""} onChange={e => updateShot(active,shot.id,{label:e.target.value})} placeholder="문구 입력" /></label> : <label className="screen-type-label"><span>화면 유형 선택</span><select value={shot.label || screenTypeOptions[active][0]} onChange={e => updateShot(active,shot.id,{label:e.target.value})}>{screenTypeOptions[active].map(option => <option key={option}>{option}</option>)}</select></label>}<div className="shot-order"><button onClick={() => moveShot(active, shot.id, -1)} disabled={idx === 0}>↑ 앞으로</button><button onClick={() => moveShot(active, shot.id, 1)} disabled={idx === activeSection.shots.length - 1}>↓ 뒤로</button></div></div><button className="remove" onClick={() => removeShot(active,shot.id)}>×</button></div>)}</div>}
        </section>
      </aside>}
      <section className="preview-panel"><div className="preview-toolbar"><div><b>실시간 미리보기</b><span>{reportPageIds.length + 1}페이지 · A4 가로</span></div><div className="legend"><span><i />표지</span><span><i />업로드된 섹션 {visibleSections.length}</span></div></div>
        <div className="report-stack"><ReportCover store={store} />{reportPageIds.map((pageId, index) => {
          const pageNumber = index + 2;
          if (pageId === "detail") return <StoreDetailCapturePage key={pageId} section={sectionsById.detail} store={store} pageNumber={pageNumber} />;
          if (pageId === "main") return <MainPageReport key={pageId} section={sectionsById.main} store={store} pageNumber={pageNumber} />;
          if (pageId === "entry1") return <EntryCapturePage key={pageId} section={sectionsById.entry1} store={store} pageNumber={pageNumber} />;
          if (pageId === "entry2") return <EntryCapturePage key={pageId} section={sectionsById.entry2} store={store} pageNumber={pageNumber} />;
          if (pageId === "gallery") return <EntryCapturePage key={pageId} section={sectionsById.gallery} store={store} pageNumber={pageNumber} />;
          if (pageId === "product") return <EntryCapturePage key={pageId} section={sectionsById.product} store={store} pageNumber={pageNumber} />;
          if (pageId === "other") return <OtherPage key={pageId} section={sectionsById.other} store={store} pageNumber={pageNumber} />;
          return <EndingPage key={pageId} store={store} pageNumber={pageNumber} />;
        })}</div>
      </section>
      </div>
    </>}
  </main></PlatformContext.Provider>;
}
