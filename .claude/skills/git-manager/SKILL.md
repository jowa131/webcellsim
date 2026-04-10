---
name: git-manager
description: Git 커밋을 수행하고 프로젝트 진행 상태(PLAN.md)를 관리합니다. 코드 작성이 완료되거나 다음 단계로 넘어갈 때 반드시 호출하십시오.
---
# Git & Task Management Rules
1. Non-Interactive: 모든 터미널 명령어는 사용자의 개입(y/n) 없이 실행되도록 플래그(-y, --no-verify 등)를 붙이세요.
2. Commit Format: feat(#이슈번호): 작업 내용 형식으로 커밋하세요.
3. Workflow: 하나의 Step 작업이 끝나면 git add . -> git commit -> PLAN.md 업데이트를 수행한 후, 사용자의 승인 없이 즉시 다음 Step으로 넘어가세요.
