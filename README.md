# MyBestSim — article SEO + catalogue eSIM Go (version corrigée)

Cette archive contient l’article, le JavaScript/CSS, ainsi que le backend FastAPI. Le backend peut aussi servir l’article directement sur le port 8000 : cette méthode évite que le navigateur bloque les appels API pour une raison CORS.

## Démarrage recommandé (une seule adresse)

1. Ouvrez un terminal dans le dossier `backend`.
2. Installez les dépendances :

   ```bash
   python3 -m pip install -r requirements.txt
   ```

3. Copiez `backend/.env.example` vers `backend/.env` puis ouvrez `.env` et remplacez `COLLE_TA_CLE_ICI` par votre vraie clé API eSIM Go. Ne partagez jamais ce fichier ni votre clé.

   macOS/Linux :
   ```bash
   cp .env.example .env
   ```

   Windows PowerShell :
   ```powershell
   Copy-Item .env.example .env
   ```

4. Toujours depuis le dossier `backend`, lancez :

   ```bash
   python3 -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
   ```

   Sous Windows, si `python3` n’existe pas, utilisez `python -m uvicorn main:app --reload --host 127.0.0.1 --port 8000`.

5. Ouvrez **http://127.0.0.1:8000**. N’ouvrez pas `index.html` en double-cliquant dessus. La page et l’API sont servies par le même serveur, ce qui évite le problème CORS habituel.

## Vérification

- `http://127.0.0.1:8000/health` doit afficher un JSON avec `api_key_configured: true` si la clé est bien configurée.
- `http://127.0.0.1:8000/api/catalogue?destination=France` doit afficher un JSON contenant `offers` si l’accès fournisseur fonctionne.
- Si la clé API est absente ou invalide, le backend renverra une erreur explicite ; cela ne peut pas être corrigé par le seul HTML.

## Option : servir le frontend séparément

Il reste possible de servir le dossier `frontend` sur le port 5500 avec `python3 -m http.server 5500 --bind 127.0.0.1`, puis d’ouvrir `http://127.0.0.1:5500`. Le backend autorise aussi les origines locales usuelles. La méthode recommandée reste cependant l’adresse `http://127.0.0.1:8000` ci-dessus.

## Sécurité

La clé eSIM Go doit rester dans `backend/.env`, côté serveur. Ne la mettez jamais dans `frontend/index.html` ou `frontend/script.js`, et ne publiez pas le fichier `.env`.
