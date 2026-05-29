---
name: "deploy"
description: "部署到生产环境"
---
```bash
git checkout deploy && git pull && git checkout main && git rebase deploy && git checkout deploy && git merge main && git push origin deploy
```
