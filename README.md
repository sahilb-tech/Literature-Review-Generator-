### LitReview Research Studio

LitReview Research Studio is a simple Flask starter app that helps you organize your research papers and automatically turn them into a first-draft literature review. 

### Features

* Upload PDFs, TXT, or Markdown files.
* Extract text from standard PDFs automatically.
* Manage your paper list directly in your browser.
* Create a 6-section review draft (Introduction, Summaries, Themes, Citations, Research Gaps, and Conclusion).
* Find main themes using simple keyword counting and sentence ranking.
* Copy your draft or download it as a .txt file.
* View quick stats on your keywords and publication years.

### Quick Start (Run Locally)

Run these commands in your terminal: 

powershell

python -m venv venv
.\venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
python app.py

Use code with caution.

After running the commands, open http://127.0.0.1:5000 in your web browser. 

### How It Works & Limitations

* **Local Processing:** This tool uses a basic, built-in formula to find and count keywords. It does **not** use AI (LLMs), search the internet, or verify facts.
* **Session-Based:** Your papers are saved in your browser's temporary memory. If you refresh or close the page, your list will reset.
* **PDF Limits:** It only reads selectable text (no scanned images/photographs). Text extraction is capped at 12,000 characters per file, so very long papers will be cut short.

### Academic Integrity

Always double-check your results! Because this tool uses simple keyword matching, the draft might leave out important context or mix up details. Make sure to verify all authors, dates, and facts against your original papers before using the text in official academic work.
*(Note: The sample papers included in the app are fictional examples for demonstration purposes only).*
