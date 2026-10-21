# 고덕지도 · 디엔핑 입점 완료 보고서

고덕지도와 디엔핑의 매장 정보 및 앱 캡처를 이용해 웹 보고서와 A4 가로형 PDF를 만드는 Next.js 내부 업무 도구입니다. 플랫폼별 디자인은 분리되어 있으며 입력, 업로드, 미리보기와 PDF 생성 기능은 공통으로 사용합니다.

## 기술 구성

- Next.js 16 + React 19 + TypeScript
- Tailwind CSS 4
- jsPDF + html2canvas 기반 브라우저 PDF 생성
- Vercel 배포 지원

## GitHub 업로드

실제 API Key가 들어 있는 `.env.local`은 업로드하지 마세요. `.gitignore`에 의해 자동 제외됩니다.

```bash
git init
git add .
git commit -m "Deploy AMAP and Dianping report builder"
git branch -M main
git remote add origin https://github.com/OWNER/REPOSITORY.git
git push -u origin main
```

이미 Git 저장소가 연결되어 있다면 마지막 두 명령 대신 현재 원격 저장소로 push하면 됩니다.

## OpenAI OCR · 번역 구조

- 브라우저는 업로드 이미지만 `/api/ocr-translate` 서버 라우트로 전송합니다.
- `OPENAI_API_KEY`는 `app/api/ocr-translate/route.ts`에서만 `process.env`로 읽습니다.
- API Key는 브라우저 번들, 응답 데이터, 소스코드에 포함되지 않습니다.
- `NEXT_PUBLIC_` 접두사가 붙은 환경변수는 브라우저에 노출될 수 있으므로 사용하지 않습니다.
- 현재 보고서 구성에서는 업로드한 캡처에 OCR·번역·요약을 자동 적용하지 않습니다.
- 브랜드스토리는 업로드한 실제 중국어 캡처와 고정 안내 문구만 보고서에 표시합니다.
- API Key가 없거나 번역에 실패해도 이미지 업로드와 보고서 작성 기능은 계속 사용할 수 있습니다.

## 로컬 개발환경 설정

1. 프로젝트 루트에서 예제 파일을 복사합니다.

   ```bash
   cp .env.example .env.local
   ```

2. `.env.local`에 본인의 키를 입력합니다.

   ```dotenv
   OPENAI_API_KEY=sk-여기에_실제_키를_입력
   OPENAI_OCR_MODEL=gpt-5-mini
   ```

3. 개발 서버를 완전히 종료한 뒤 다시 실행합니다.

   ```bash
   pnpm install --frozen-lockfile
   pnpm dev
   ```

`.env.local`은 `.gitignore`의 `.env*` 규칙으로 Git에서 제외됩니다. 실제 키가 들어간 파일은 커밋하거나 공유하지 마세요. 저장소에는 값이 비어 있는 `.env.example`만 포함합니다.

## Vercel 배포환경 설정

Vercel 대시보드에서 다음 순서로 설정합니다.

1. 해당 프로젝트를 선택합니다.
2. **Settings → Environment Variables**로 이동합니다.
3. 이름에 `OPENAI_API_KEY`, 값에 실제 API Key를 입력합니다.
4. 사용할 환경을 **Production**, **Preview**, **Development** 중 필요한 범위로 선택합니다.
5. 선택 사항으로 `OPENAI_OCR_MODEL=gpt-5-mini`를 추가합니다.
6. 환경변수를 추가하거나 변경한 뒤 프로젝트를 다시 배포합니다.

GitHub 저장소를 Vercel의 **Add New → Project**에서 선택하면 별도 설정 없이 다음 값이 자동 적용됩니다.

- Framework Preset: `Next.js`
- Install Command: `pnpm install --frozen-lockfile`
- Build Command: `pnpm build`
- Output Directory: Next.js 기본값

CLI를 사용할 경우 다음과 같이 등록할 수 있습니다.

```bash
vercel env add OPENAI_API_KEY production
vercel env add OPENAI_API_KEY preview
vercel env add OPENAI_API_KEY development
```

Vercel의 개발용 환경변수를 `.env.local`로 내려받으려면 다음 명령을 사용할 수 있습니다.

```bash
vercel link
vercel env pull .env.local
```

## 이 Sites 배포환경 설정

현재 `chatgpt.site` 배포에서도 로컬 `.env.local` 파일은 배포되지 않습니다. 배포 서비스의 런타임 환경변수에 `OPENAI_API_KEY`를 별도로 등록해야 자동 번역이 활성화됩니다. 키가 등록되지 않은 상태에서는 보안상 클라이언트에 대체 키를 전달하지 않고 번역 기능만 비활성화됩니다.

## 실행 및 검증

```bash
pnpm dev
pnpm build
```

`pnpm build`는 Vercel과 동일한 Next.js 프로덕션 빌드를 실행합니다. 기존 Sites 환경용 명령은 별도로 유지됩니다.

```bash
pnpm dev:sites
pnpm build:sites
```

각 탭에서 캡처를 드래그해 업로드한 뒤 실제 이미지가 그대로 미리보기와 PDF에 반영되는지 확인합니다. 현재 보고서 화면에서는 OCR이나 번역 요청이 발생하지 않는 것이 정상입니다.
