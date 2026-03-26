# norch 설치 가이드

## 설치
1. [DMG 다운로드](https://github.com/sangwookp9591/ai-ng-norch/releases/latest)
2. norch.app을 Applications로 드래그

## 처음 실행 시 (코드사이닝 없음)
macOS가 "손상되었기 때문에 열 수 없습니다" 경고를 표시합니다.
터미널에서 다음 명령 실행:

```bash
xattr -cr /Applications/norch.app
```

그 후 정상적으로 열 수 있습니다.

## 요구사항
- macOS 14+ (Sonoma)
- Apple Silicon (arm64)
- 확장 패널: `cd norch && npm run dev` (localhost:3819)
