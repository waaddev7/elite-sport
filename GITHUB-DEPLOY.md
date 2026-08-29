# Elite Sport — GitHub-ready package

## What is included
The complete uploaded frontend, images, videos, and the `EliteSport-Backend` source are included. Local `.git`, `node_modules`, and `.env` files were removed so secrets/dependencies are not committed.

## Security change
The Groq key that was embedded in browser files was removed. The AI Trainer and chatbot now call the backend. Create a NEW Groq key (revoke/rotate the old exposed key) and put it only in `EliteSport-Backend/.env` using `.env.example` as a template. Never commit `.env`.

## Frontend on GitHub Pages
Upload the contents of this folder to a GitHub repository. In GitHub: Settings > Pages > Deploy from a branch > `main` > `/(root)`.

## Backend
GitHub Pages cannot run Node/Express or MySQL. Deploy `EliteSport-Backend` to a Node-capable host and configure its environment variables. Then edit `api.js` and replace `http://localhost:4000` with the HTTPS URL of the deployed backend.

For local backend use:
1. `cd EliteSport-Backend`
2. copy `.env.example` to `.env` and fill in your NEW Groq key and database settings
3. `npm install`
4. `npm start`

The static pages can then call `http://localhost:4000` while developing locally.
