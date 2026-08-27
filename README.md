# Mobile Bwipo

Casca nativa **Android** (Capacitor) do CRM. O WebView carrega a URL remota do frontend. Este repositório **não** contém o CRM web — só o APK.

Repositório: `https://github.com/caiovpinheiro/Mobile_Bwipo.git`

## Branches

| Branch | APK aponta para |
|--------|-----------------|
| `main` | Produção — `https://bwipo.com/` |
| `DEV_APK` | DEV — `https://crm-dev-frontend.ca31ey.easypanel.host/` |

A UI do CRM **não** vem deste repo. Quem atualiza telas/features é o frontend:

- Produção: `frontend_crm1` → `main`
- DEV: `frontend_crm1` → `DEV_BRANCH`

Push na `DEV_BRANCH` atualiza o app DEV **sem** gerar APK novo. Só precisa de APK novo quando mudar `server.url`, plugin, ícone ou permissão.

**Não** aponte o EasyPanel deste repo para `bwipo.com`. Esse domínio é do CRM web.

## Setup

```bash
npm install
npm run sync
```

Stack: **Capacitor 7** (Node 20). Capacitor 8 exige Node ≥ 22.

## Assinatura (release)

A keystore **não** entra no Git.

- Arquivo: `%USERPROFILE%\eduit-crm-release.keystore`
- Alias: `eduit-crm`
- Credenciais: `android/keystore.properties` (gitignored)

```bash
cd android
.\gradlew.bat assembleRelease
```

APK: `android/app/build/outputs/apk/release/app-release.apk`
