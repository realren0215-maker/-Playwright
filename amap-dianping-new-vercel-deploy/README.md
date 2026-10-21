# 고덕지도 · 디엔핑 입점 보고서

새 GitHub 저장소와 Vercel 프로젝트에 바로 배포할 수 있도록 정리한 독립형 Next.js 프로젝트입니다.

## 로컬 실행

```bash
npm install
npm run dev
```

## 빌드 확인

```bash
npm run build
```

## GitHub 업로드

```bash
git init
git add .
git commit -m "Initial deployment"
git branch -M main
git remote add origin https://github.com/OWNER/REPOSITORY.git
git push -u origin main
```

## Vercel 배포

1. Vercel에서 **Add New → Project**를 선택합니다.
2. 위 GitHub 저장소를 가져옵니다.
3. Framework Preset은 `Next.js`를 사용합니다.
4. Build Command는 `npm run build`를 사용합니다.
5. 필요한 경우 `OPENAI_API_KEY`와 `OPENAI_OCR_MODEL`을 Environment Variables에 추가합니다.
6. Deploy를 실행합니다.

`OPENAI_API_KEY`가 없어도 이미지 업로드, 미리보기와 PDF 생성 기능은 정상 작동합니다. 실제 키는 `.env.local`에만 입력하고 GitHub에 커밋하지 마세요.
