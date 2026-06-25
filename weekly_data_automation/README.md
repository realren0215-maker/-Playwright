# 백오피스 주간데이터 다운로드 자동화

Python + Playwright로 따중디엔핑 백오피스에 매장별 로그인 후 주간데이터를 다운로드하고, 매장별 시트로 통합 엑셀을 만드는 자동화입니다.

## 1. 설치

```bash
cd /Users/choeinhye/Documents/Codex/2026-06-25/codex/outputs/weekly_data_automation
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
playwright install chromium
```

## 2. 테스트 실행

`config.yaml`의 `test_limit: 2`가 기본값이라 처음에는 엑셀 상단 2개 매장만 실행합니다.

```bash
python weekly_downloader.py --config config.yaml
```

특정 매장만 테스트하려면:

```bash
python weekly_downloader.py --config config.yaml --stores "도담게장,우대포 블랙 명동점"
```

## 3. 전체 매장 실행

`config.yaml`에서 `test_limit: null`로 바꾼 뒤 실행합니다.

```bash
python weekly_downloader.py --config config.yaml
```

## 4. 결과물

기본 출력 폴더는 `downloads`입니다.

- 원본 다운로드: `downloads/raw/YYYY-MM-DD/매장명.xlsx`
- 최종 통합 파일: `downloads/주간데이터_YYYY-MM-DD.xlsx`
- 실패 로그: `downloads/failure_log_YYYY-MM-DD.csv`

## 5. 보안 인증이 뜨는 경우

사이트에서 슬라이드 인증 또는 인증번호 입력이 뜨면, 브라우저에서 직접 처리한 뒤 터미널에서 Enter를 누르면 다음 매장으로 계속 진행합니다. 인증 제한이 반복되면 해당 매장은 실패 로그에 사유가 기록됩니다.

## 6. 화면이 바뀐 경우

백오피스 메뉴명이나 버튼명이 바뀌면 `config.yaml`의 `navigation.click_texts`, `download_flow` 값을 수정하세요.
