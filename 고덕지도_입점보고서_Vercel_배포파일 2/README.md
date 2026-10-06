# 고덕지도 입점 완료 보고서 — Vercel 배포본

## Vercel 배포

1. 이 폴더 전체를 GitHub 저장소에 올립니다.
2. Vercel에서 **Add New → Project**를 선택하고 저장소를 연결합니다.
3. Framework Preset은 **Next.js**를 사용합니다.
4. 별도의 Root Directory가 없다면 기본값을 유지합니다.
5. **Deploy**를 실행합니다.

## 환경변수

Vercel의 **Settings → Environment Variables**에서 필요할 경우 아래 값을 등록합니다.

- `OPENAI_API_KEY`: 서버 측 OCR/번역 API Key
- `OPENAI_OCR_MODEL`: 선택 사항, 기본값 `gpt-5-mini`

API Key가 없어도 이미지 업로드, 보고서 미리보기, PC·모바일 PDF 생성 기능은 정상 작동합니다. 실제 키가 들어간 `.env.local` 파일은 업로드하지 마세요.

## 로컬 실행

```bash
pnpm install
pnpm dev
```

프로덕션 빌드 확인:

```bash
pnpm build
```

PDF는 PC에서 파일로 다운로드됩니다. 모바일에서는 기기가 지원하면 공유·파일 저장 화면을 바로 열고, 지원하지 않으면 전용 저장 화면에서 `.pdf` 파일을 다운로드하거나 열 수 있습니다. 결과 규격은 A4 가로형으로 고정됩니다.
