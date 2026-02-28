Place your local Firebase Admin service account file in this folder.

Recommended filename:
- `mjstem-admin.json`

Do not commit real keys. `secrets/*.json` is ignored by `.gitignore`.

Auto-populate `.env.local` from the JSON:
- `powershell -ExecutionPolicy Bypass -File scripts/setup-firebase-admin-env.ps1 -ServiceAccountJsonPath secrets/mjstem-admin.json`
