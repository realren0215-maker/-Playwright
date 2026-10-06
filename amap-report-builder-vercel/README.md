# 고덕지도 입점 완료 보고서 제작기

Next.js 기반의 고덕지도(AMAP) 입점 완료 보고서 제작 도구입니다. 매장정보와 실제 앱 캡처를 입력해 웹 미리보기와 A4 가로형 PDF를 생성합니다.

## 요구사항

- Node.js 22 이상
- npm 10 이상 권장

## 로컬 실행

```bash
npm ci
cp .env.example .env.local
npm run dev
```

브라우저에서 `http://localhost:3000`을 엽니다.

프로덕션 빌드 확인:

```bash
npm run build
npm run start
```

## 환경변수

`.env.local`은 Git에 포함하지 마세요. `.gitignore`에서 모든 `.env*` 파일을 제외하며, 값이 없는 `.env.example`만 저장소에 포함합니다.

```dotenv
# 선택 사항: 서버 API 라우트에서만 사용하는 OpenAI 키
OPENAI_API_KEY=

# 선택 사항: OCR 모델 변경
OPENAI_OCR_MODEL=gpt-5-mini

# 로컬 또는 배포된 사이트 주소
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

현재 보고서 UI는 OCR이나 자동 번역을 실행하지 않으므로 `OPENAI_API_KEY` 없이도 전체 보고서 작성·미리보기·PDF 출력이 정상 작동합니다. 키는 `app/api/ocr-translate/route.ts` 서버 라우트에서만 읽으며 브라우저 번들에 포함되지 않습니다.

## Vercel 배포

### 대시보드로 배포

1. ZIP 압축을 해제하고 GitHub, GitLab 또는 Bitbucket 저장소에 업로드합니다.
2. Vercel에서 **Add New → Project**를 선택하고 저장소를 연결합니다.
3. Framework Preset이 **Next.js**인지 확인합니다.
4. Build Command는 `npm run build`, Output Directory는 기본값을 사용합니다.
5. **Settings → Environment Variables**에서 다음 값을 등록합니다.
   - `NEXT_PUBLIC_SITE_URL`: 실제 Vercel 운영 주소
   - `OPENAI_API_KEY`: OCR API를 사용할 때만 등록
   - `OPENAI_OCR_MODEL`: 필요할 때만 등록
6. Deploy를 실행합니다. 환경변수를 나중에 변경하면 다시 배포해야 합니다.

### Vercel CLI로 배포

```bash
npm install -g vercel
vercel link
vercel env add NEXT_PUBLIC_SITE_URL production
vercel --prod
```

## 주요 파일

- `app/page.tsx`: 보고서 입력, 이미지 업로드, 미리보기 구성
- `app/api/ocr-translate/route.ts`: 선택적 서버 전용 OCR API
- `app/globals.css`: 공통 및 인쇄 스타일
- `app/report-combo.css`: 보고서 페이지 레이아웃
- `app/drag-drop.css`: 드래그 앤 드롭 업로드 UI
- `public/`: 파비콘과 소셜 미리보기 이미지

## PDF 저장

사이트의 **PDF 보고서 생성** 버튼을 누른 뒤 브라우저 인쇄 창에서 대상을 **PDF로 저장**, 방향을 **가로**로 선택합니다. 인쇄용 CSS는 A4 가로형으로 설정되어 있습니다.
