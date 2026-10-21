export type ReportPlatformId = "amap" | "dianping";

export type ReportPlatform = {
  id: ReportPlatformId;
  name: string;
  nativeName: string;
  shortName: string;
  reportCode: string;
  coverEyebrow: string;
  coverSubtitle: string;
  verifiedLabel: string;
  mark: string;
};

export const reportPlatforms: Record<ReportPlatformId, ReportPlatform> = {
  amap: {
    id: "amap",
    name: "고덕지도",
    nativeName: "高德地图",
    shortName: "AMAP",
    reportCode: "AMAP STORE ONBOARDING",
    coverEyebrow: "AMAP · 高德地图",
    coverSubtitle: "해외 매장 등록 및 콘텐츠 노출 결과",
    verifiedLabel: "고덕지도 매장 정보 노출 확인",
    mark: "➤",
  },
  dianping: {
    id: "dianping",
    name: "디엔핑",
    nativeName: "大众点评",
    shortName: "DIANPING",
    reportCode: "DIANPING STORE ONBOARDING",
    coverEyebrow: "DIANPING · 大众点评",
    coverSubtitle: "해외 매장 등록 및 콘텐츠 노출 결과",
    verifiedLabel: "디엔핑 매장 정보 노출 확인",
    mark: "★",
  },
};
