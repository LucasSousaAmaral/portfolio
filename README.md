# Portfólio (Next.js + .NET 8 + AWS)

Monorepo com frontend estático (Next 15), backend serverless (.NET 8 em Lambda), IaC (Terraform) e CI/CD (GitHub Actions via OIDC).

## Arquitetura (alto nível)
- Frontend: Next.js 15 (`output: 'export'`) servido em S3 + CloudFront.
- Backend: Lambda + API Gateway (HTTP API), DynamoDB.
- Uploads: URL pré-assinada (S3) emitida pelo backend.

## Variáveis (exemplo)
- `NEXT_PUBLIC_API_BASE_URL` = `<API_BASE_URL_DEV>`
- (Preview por PR usa `BASE_PATH` e `ASSET_PREFIX`)

## Deploy
- Front (main): build estático → S3 → invalidation no CloudFront.
- Back (main): empacota e atualiza código da Lambda.
- OIDC: GitHub Actions assume uma IAM Role (sem chaves).

## Desenvolvimento
```bash
# Front
cd frontend && npm i && npm run dev

# Build estático
npm run build
aws s3 sync ./out s3://<S3_BUCKET_DEV> --delete
aws cloudfront create-invalidation --distribution-id <CF_DISTR_ID_DEV> --paths "/*"
