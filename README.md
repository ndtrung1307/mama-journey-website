# MamaJourney Website

Static website for the MamaJourney app Privacy Policy and Contact page. Designed for deployment on GitHub Pages.

## Privacy Policy Architecture

The privacy policy uses a **single source of truth**:

```
shared/legal/privacy-policy/privacy-policy.json
```

- **Website:** generates `privacy-policy/index.html` from JSON — no manually maintained copy.
- **iOS:** bundles the same JSON file (or an automatically synced copy) — no duplicated in-app content.

### Updating the Privacy Policy

1. Edit `shared/legal/privacy-policy/privacy-policy.json`
2. Bump `version` and update `effectiveDate`
3. Validate: `python3 scripts/validate-privacy-policy.py`
4. Generate the website: `python3 scripts/build-privacy-policy.py`
5. Update the bundled JSON in the iOS project
6. QA the website and iOS app
7. Commit all changes together

For the JSON schema and iOS integration notes, see `shared/legal/privacy-policy/README.md`.

## Project Structure

```
mamajourney-website/
├── shared/
│   └── legal/
│       └── privacy-policy/
│           ├── privacy-policy.json   # Canonical content source
│           └── README.md
├── scripts/
│   ├── build-privacy-policy.py       # Generate HTML from JSON
│   ├── validate-privacy-policy.py    # Validate JSON
│   └── markdown_utils.py
├── index.html
├── privacy-policy/
│   └── index.html                    # Generated — do not edit manually
├── contact/
│   └── index.html
├── css/
│   └── style.css
├── js/
│   └── nav.js                        # Mobile navigation toggle
├── assets/
│   ├── application-icon.png
│   └── home-header.png
├── .nojekyll
└── README.md
```

## Local Preview

```bash
python3 scripts/validate-privacy-policy.py
python3 scripts/build-privacy-policy.py
python3 -m http.server 8000
```

Open: `http://localhost:8000`

## Deploy with GitHub Pages

1. Run the build script before committing (if JSON was changed).
2. Push the repository to GitHub.
3. Go to **Settings → Pages**.
4. Choose **Deploy from a branch**.
5. Branch: `main`, folder: `/ (root)`.
6. Save and wait a few minutes.

Default URL: `https://<username>.github.io/mamajourney-website/`

## Custom Domain (later)

When DNS for `mamajourney.app` is ready:

1. Create a `CNAME` file at the repo root containing: `mamajourney.app`
2. Configure the custom domain in GitHub Pages settings.
3. Set up DNS records per GitHub’s instructions.

## Contact

Email: `ndtrung1307@gmail.com`

Contact page: `contact/index.html`

## Important Notes

- This website **does not** collect user data and does not use analytics, cookies, or forms.
- When data handling in the app changes, update the policy JSON and review your App Store Connect disclosures.
- Do not edit `privacy-policy/index.html` directly — that file is generated.
