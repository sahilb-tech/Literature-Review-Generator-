# LitReview Research Studio

A Flask-based starter application for organizing research papers and generating an exploratory literature-review draft from the paper text supplied by the researcher.

## Features

- Import text-based PDF, TXT, and Markdown files.
- Extract selectable PDF text with PyMuPDF on the Flask backend.
- Add and remove paper records in the current browser session.
- Generate a structured six-section draft: Introduction, Paper Summaries, Theme Analysis, Publication and Citation Overview, Potential Research Gaps, and Conclusion.
- Use extractive sentence ranking for paper summaries and simple keyword/repeated-term analysis for exploratory themes.
- Copy the generated draft or download it as a `.txt` file.
- Show library insights for keywords and publication-year coverage.

## Run locally

```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
python app.py
```

Then open `http://127.0.0.1:5000`.

## How review generation works

The current generator is a local, heuristic baseline. It ranks sentences from the supplied paper text, summarizes the records, counts user-supplied keywords and repeated terms, and builds cautious synthesis sections. It does **not** call an LLM, browse academic databases, verify DOIs, check citations, or establish research consensus. Treat the output as a starting draft and verify claims against the original publications.

## PDF limitations

PDF text extraction works for selectable text. Scanned/image-only PDFs require OCR. Extraction is capped at 12,000 characters per imported file in this starter app, so longer papers may be truncated. The current paper library is held in browser memory and does not persist after refreshing the page.

## Academic integrity

The app does not invent citations intentionally, but heuristic output can still be incomplete or misleading. Verify authors, titles, publication years, methods, findings, limitations, and every reference before using the draft in academic work. The included sample records are illustrative examples, not real publications.
