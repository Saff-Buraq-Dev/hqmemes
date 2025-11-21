# HQMemes – Deployment Guide

Une procédure compacte pour passer du code local à un déploiement complet sur AWS (infra + backend + frontend). Les commandes utilisent le shell `zsh/bash` et supposent que tu travailles depuis la racine du repo.

---

## 0. Prérequis
- **AWS CLI v2** configuré avec un profil ayant les droits nécessaires (`aws sts get-caller-identity` pour vérifier).
- **Docker** (requis pour le bundling automatique du backend par CDK).
- **Node.js ≥ 18** et **npm** (utilisés par `frontend/` et `infra/`).
- Accès aux domaines et zones Route53 déjà configurés (cf. valeurs `.env` ci-dessous).

---

## 1. Installer les dépendances projet
```bash
# Dépendances infrastructure CDK
cd infra-cdk
npm install

# Dépendances frontend
cd ../frontend
npm install
```

---

## 2. Préparer les fichiers d’environnement

### 2.1 `infra/.env` (obligatoire avant tout déploiement)
Creates the configuration lue par les stacks CDK et par le script d’injection du frontend.

```bash
cd infra-cdk
cp create-env.sh{,.bak}   # (facultatif) garde une copie du script de référence
./create-env.sh           # génère un .env avec les valeurs de prod actuelles
```

Si tu dois modifier des valeurs, édite `infra-cdk/.env`. Les clés attendues :

| Variable | Description |
| --- | --- |
| `AWS_ACCOUNT_ID` | ID du compte AWS cible |
| `AWS_REGION` | Région principale (ex: `ca-central-1`) |
| `PROJECT_NAME` | Préfixe des stacks (`hqmemes`) |
| `ENVIRONMENT` | Suffixe d’environnement (`prod`, `staging`, …) |
| `DOMAIN_NAME` | Domaine racine (ex: `dev.gharbidev.com`) |
| `HOSTED_ZONE_ID` | ID Route53 de la zone publique |
| `FRONTEND_DOMAIN` | FQDN du frontend (ex: `hqmemes.dev.gharbidev.com`) |
| `ASSETS_DOMAIN` | FQDN pour les assets (ex: `assets-hqmemes.dev.gharbidev.com`) |
| `API_DOMAIN` | FQDN de l’API (ex: `api-hqmemems.dev.gharbidev.com`) |
| `VITE_*` | Valeurs injectées dans le build frontend (nom appli, limites upload, etc.) |

### 2.2 Générer l’environnement frontend déployé
Après chaque déploiement CDK, régénère `frontend/.env` pour aligner les URLs/API IDs :

```bash
cd infra-cdk
npx ts-node scripts/inject-frontend-env.ts
```

Le script crée/écrase `frontend/.env` avec les valeurs issues de `.env` et/ou des outputs CloudFormation. Pour du dev local, tu peux ensuite copier ces valeurs :

```bash
cd ../frontend
```

---

## 3. Déployer l’infrastructure AWS (CDK)

> ⚠️ Assure-toi que Docker est lancé et que tes variables d’environnement/profils AWS sont chargés.

```bash
cd infra-cdk

# Facultatif (une seule fois par compte/région) :
npx cdk@latest bootstrap aws://$AWS_ACCOUNT_ID/ca-central-1 aws://$AWS_ACCOUNT_ID/us-east-1

# Build TypeScript -> JS
npm run build

# 1) Certificats CloudFront (us-east-1)
npx cdk@latest deploy hqmemes-prod-certificates-stack --require-approval never

# 2) Infrastructure principale (ca-central-1)
npx cdk@latest deploy hqmemes-prod-stack --require-approval never
```

Les outputs utiles (bucket frontend, ID CloudFront, ID user pool, etc.) sont visibles dans la console CloudFormation ou via :

```bash
aws cloudformation describe-stacks \
  --stack-name hqmemes-prod-stack \
  --region ca-central-1 \
  --query 'Stacks[0].Outputs'
```

---

## 4. Builder et publier le frontend

```bash
cd ../frontend
npm run build

# Récupère le nom du bucket frontend depuis CloudFormation
FRONTEND_BUCKET=$(aws cloudformation describe-stacks \
  --stack-name hqmemes-prod-stack \
  --region ca-central-1 \
  --query "Stacks[0].Outputs[?OutputKey=='FrontendBucketName'].OutputValue" \
  --output text)

# Publie les assets (vider le cache local si besoin avant)
aws s3 sync dist/ "s3://${FRONTEND_BUCKET}" --delete --region ca-central-1

# Invalidation CloudFront pour servir la nouvelle version
CLOUDFRONT_ID=$(aws cloudformation describe-stacks \
  --stack-name hqmemes-prod-stack \
  --region ca-central-1 \
  --query "Stacks[0].Outputs[?OutputKey=='CloudFrontDistributionId'].OutputValue" \
  --output text)

aws cloudfront create-invalidation \
  --distribution-id "${CLOUDFRONT_ID}" \
  --paths "/*"
```

---

## 5. Vérifications post-déploiement

```bash
# Santé backend
curl https://api-hqmemems.dev.gharbidev.com/health

# (Optionnel) vérifier le code de la version buildée
aws s3 ls "s3://${FRONTEND_BUCKET}"
```

- Tester manuellement : signup/login, upload, pagination, toasts, avatars, etc.
- Surveiller CloudWatch Logs (`aws logs tail /aws/lambda/hqmemes-prod-api --follow --region ca-central-1`) pour détecter d’éventuelles erreurs.

---

## Résumé rapide
1. `infra-cdk/.env` prêt → `npm run build` → `cdk deploy` (certifs puis stack principale).
2. `npx ts-node scripts/inject-frontend-env.ts`.
3. `frontend/npm run build` → `aws s3 sync` → `aws cloudfront create-invalidation`.
4. Vérifier `/health`, tester l’application.

Tu peux conserver ce guide à la racine (`DEPLOYMENT_GUIDE.md`) et l’ajuster si de nouvelles étapes apparaissent (SES, monitoring, etc.).


