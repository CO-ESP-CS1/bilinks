# Deploiement Vercel (apps/web)

## Reglages projet Vercel

- Framework Preset: `Next.js`
- Root Directory: `apps/web`
- Install Command: `npm install`
- Build Command: `npm run build`

## Variables d'environnement

Configurer au minimum:

- `NEXT_PUBLIC_API_URL=https://bibliotech-api-iu9o.onrender.com`

Optionnel:

- `NEXT_PUBLIC_ADMIN_BEARER_TOKEN=<jwt_admin>`

## Notes

- Le frontend lit `NEXT_PUBLIC_API_URL` en priorite.
- `NEXT_PUBLIC_API_BASE_URL` reste supporte pour compatibilite.
