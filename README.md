# RYCP Rwanda Community Website

A fully responsive, mobile first website for RYCP Rwanda Community (Rwanda Rural and Urban Youth Competitiveness Promoters), built with plain HTML, CSS and JavaScript. No frameworks, no build step. Open `index.html` in a browser or upload the whole folder to any web host.

## Pages

| File | Page |
|------|------|
| `index.html` | Home, with auto cycling hero image slider |
| `about.html` | History, mission, vision, values, governance, strategic plan, achievements |
| `services.html` | All ten services plus how we work |
| `clusters.html` | Agribusiness and Creative Industry clusters, ISHU program |
| `membership.html` | Bronze / Silver / Gold plans, online registration form, member login, FAQ |
| `media.html` | News, events, gallery, success stories, publications |
| `contact.html` | Contact details, message form, map, socials |

Shared assets live in `assets/css/style.css`, `assets/js/main.js` and `assets/img/`.

## Things to update before launch

1. **Phone number**: the contact page currently says the number is coming soon. Add the real one in `contact.html` and the top bar of each page if desired.
2. **Social media links**: all social icons point to `#`. Replace with the real profile URLs (search for `aria-label="Facebook"` etc. in each page).
3. **Forms**: all forms show a local success message only (`data-demo` attribute). Connect them to a backend, Formspree, or a similar service, then remove the `data-demo` attribute and the demo handler in `main.js`.
4. **Success stories**: the two member stories are illustrative drafts based on real program results. Replace them with real quotes and names once members give permission.
5. **Payment details**: MoMoPay code and bank account are intentionally not published. Add them on the contact page if the organization wants them public.
6. **Photos**: current photos are stock images from Unsplash. Swap in real photos of RYCP members and events in `assets/img/` as they become available, keeping the same file names for a zero-code swap.
7. **Privacy Policy and Terms**: footer links are placeholders (`#`).

## Brand

Colors come from the logo: deep green (`#166534` family) with white, plus yellow `#f5b301`, blue `#2b95d0` and orange `#ef7622` as accents. Typeface is Plus Jakarta Sans from Google Fonts. All design tokens are defined at the top of `assets/css/style.css`.
