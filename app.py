"""Flask entry point for the Literature Review Generator starter app."""
from flask import Flask, jsonify, render_template, request
import requests
import pymupdf  # Extracts selectable text from PDF files on the server.

app = Flask(__name__)
app.config["MAX_CONTENT_LENGTH"] = 20 * 1024 * 1024  # Limit uploads to 20 MB.

@app.get("/")
def index():
    """Render the main research workspace."""
    return render_template("index.html")


@app.post("/extract-pdf")
def extract_pdf():
    """Receive a selected PDF and return its selectable text as JSON."""
    uploaded = request.files.get("file")
    if uploaded is None or not uploaded.filename:
        return jsonify({"error": "Choose a PDF file first."}), 400
    if not uploaded.filename.lower().endswith(".pdf"):
        return jsonify({"error": "Please upload a PDF file."}), 400

    try:
        pdf_bytes = uploaded.read()
        with pymupdf.open(stream=pdf_bytes, filetype="pdf") as document:
            text = "\n\n".join(page.get_text("text") for page in document)
    except Exception:
        return jsonify({"error": "The PDF could not be read. It may be damaged or password-protected."}), 400

    if not text.strip():
        return jsonify({"error": "No selectable text found. Scanned PDFs need OCR first."}), 422
    return jsonify({"text": text[:12000], "truncated": len(text) > 12000})


@app.errorhandler(413)
def file_too_large(_error):
    return jsonify({"error": "File is too large. Please choose a PDF under 20 MB."}), 413


if __name__ == "__main__":
    # Debug mode is convenient locally; turn it off for deployment.
    app.run(debug=True)

@app.route("/api/ai-review", methods=["POST"])
def ai_review():
    data = request.get_json(silent=True) or {}
    papers = data.get("papers", [])

    if not isinstance(papers, list) or not papers:
        return jsonify({
            "error": "Please add at least one research paper."
        }), 400

    if len(papers) > 8:
        return jsonify({
            "error": "Please submit no more than 8 papers at once."
        }), 400

    paper_details = []

    for i, paper in enumerate(papers, start=1):
        if not isinstance(paper, dict):
            continue

        title = str(paper.get("title", "Untitled"))[:300]
        authors = str(paper.get("authors", "Not provided"))[:500]
        year = str(paper.get("year", "Not provided"))[:20]
        journal = str(paper.get("journal", "Not provided"))[:300]
        keywords = str(paper.get("keywords", ""))[:500]
        abstract = str(paper.get("abstract", ""))[:6000]

        paper_details.append(
            f"""
Paper {i}
Title: {title}
Authors: {authors}
Year: {year}
Journal: {journal}
Keywords: {keywords}
Abstract: {abstract}
"""
        )

    if not paper_details:
        return jsonify({"error": "No valid paper details were provided."}), 400

    prompt = f"""
You are an academic research assistant.

Use only the supplied paper information. Do not invent authors,
publication years, findings, quotations, or citations.
If the abstracts do not provide enough evidence, say so explicitly.

Write a structured literature review with these six sections:

1. Introduction
2. Paper Summaries
3. Theme Analysis
4. Citation Overview
5. Research Gaps
6. Conclusion

Compare the studies where the supplied evidence permits.
Distinguish reported findings from your own cautious interpretation.
Do not claim to have read full papers when only abstracts are supplied.
Do not invent citation counts or bibliographic references.

Research papers:
{chr(10).join(paper_details)}
"""

    try:
        response = requests.post(
            "http://localhost:11434/api/generate",
            json={
                "model": "qwen3:8b",
                "prompt": prompt,
                "stream": False,
                "options": {
                    "temperature": 0.3,
                    "num_predict": 1800
                }
            },
            timeout=600
        )
        response.raise_for_status()
        result = response.json()
        review = result.get("response", "").strip()

        if not review:
            return jsonify({
                "error": "The model returned an empty response."
            }), 502

        return jsonify({
            "review": review,
            "model": "qwen3:8b"
        })

    except requests.exceptions.ConnectionError:
        return jsonify({
            "error": "Cannot connect to Ollama. Make sure Ollama is running."
        }), 503

    except requests.exceptions.Timeout:
        return jsonify({
            "error": "The AI took too long to respond. Try fewer or shorter papers."
        }), 504

    except requests.exceptions.RequestException:
        app.logger.exception("Ollama request failed")
        return jsonify({
            "error": "Ollama could not generate the review."
        }), 502