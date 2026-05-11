# MiaGPT transcript — Manje gratis (HT)

Transkripsyon ki sove pou demontre repons MiaGPT an Kreyòl Ayisyen. Kaptire kont round-3 seed data (resous EN/HT/ES/FR).

---

**user:** Map chèche manje gratis pou fanmi mwen nan Little Haiti. Ki kote mwen ka jwenn?

**assistant** (tool_use): `query_resources` ak `{ "category": "food", "language": "ht" }`

**tool_result:** 3 rezilta — `Feeding South Florida`, `Farm Share`, `Sant La Haitian Neighborhood Center`.

**assistant:**

Genyen 3 òganizasyon ki ka ede w jodi a:

1. **Feeding South Florida** — yon gwo bank manje rejyonal pou Miami-Dade. Yo gen distribisyon manje regilye nan diferan kote. Tcheke kalandriye yo sou sit la pou jwenn yon distribisyon pwòch ou. [Sous](https://feedingsouthflorida.org/)

2. **Farm Share** — yon lòt bank manje pou tout Florid. Yo gen distribisyon manje fre (fwi, legim) regilye nan Miami-Dade. Itilize "Find a distribution" sou sit la pou wè kote ki pwòch ou. [Sous](https://farmshare.org/)

3. **Sant La Haitian Neighborhood Center** — yo pa yon bank manje, men yo ka ede w aplike pou SNAP (food stamps) e konekte w ak lòt sèvis. Si w bezwen èd ranpli papye, ale sou bò pa yo. [Sous](https://santla.org/)

Konsèy pratik: pa bezwen pote idantifikasyon imigrasyon pou jwenn manje nan distribisyon yo. Si w pa konnen ki distribisyon ki pi pre w, ban mwen kòd postal ou (zip code) e map ka chèche.

Si w bezwen w èd ak SNAP oswa kat WIC, di m epi map gade.

---

**Notes for reviewers:**
- The model replied entirely in Kreyòl after the user opened in Kreyòl — per the prompt rule "Stay in the user's language."
- It distinguished a food bank (gives food directly) from a navigator (helps you apply for benefits) — useful disambiguation for a real user.
- It offered to refine with a ZIP code without demanding PII. The privacy note in `prompts/ht.md` and `docs/privacy.md` shows this is by design.
