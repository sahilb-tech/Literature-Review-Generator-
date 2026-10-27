### LitReview Research Studio

LitReview Research Studio is a lightweight Flask starter application designed to streamline academic workflows. It helps researchers organize literature and instantly generate structured, first-draft literature reviews. 

### Core Features

* **Flexible File Support:** Seamlessly process PDF, TXT, and Markdown files.
* **Automated Text Extraction:** Extract selectable text from standard PDFs instantly.
* **Client-Side Session Management:** Manage your reading list securely within your browser session.
* **Structured Draft Generation:** Produce an immediate 6-section review framework covering the Introduction, Methodology Summaries, Core Themes, Citations, Research Gaps, and Conclusions.
* **Algorithmic Insights:** Identify recurring themes using deterministic keyword frequency analysis and sentence ranking.
* **One-Click Export:** Copy the generated draft directly to your clipboard or download it as a .txt file.
* **Library Analytics:** View instant statistical summaries of your dataset's top keywords and publication timelines.

### Quick Start (Local Deployment)

Deploy the application locally by executing the following commands in your terminal: 

powershell

# Create a virtual environment
python -m venv venv

# Activate the virtual environment
.\venv\Scripts\Activate.ps1

# Install required dependencies
python -m pip install -r requirements.txt

# Launch the Flask server
python app.py

Use code with caution.

Once the server is running, navigate to http://127.0.0.1:5000 in your web browser. 

### Technical Architecture & Limitations

* **Deterministic Processing:** The application relies entirely on programmatic keyword matching and rule-based heuristics. It does not utilize Large Language Models (LLMs), require internet connectivity, or perform external fact-checking.
* **Volatile Session Storage:** Data is stored temporarily within the browser session. Refreshing or closing the browser window will clear your active paper list.
* **PDF Extraction Constraints:** The extractor only processes selectable text layers and cannot parse scanned images or OCR-dependent documents. Document extraction is capped at 12,000 characters per file to optimize local performance.

### Academic Integrity & Verification

Always verify your outputs. Because this tool generates drafts using strict keyword frequencies rather than semantic understanding, the resulting text may omit critical context or misattribute details. Users are responsible for cross-referencing all authors, publication dates, and empirical findings with the original source materials before incorporating them into formal academic work. 

*(Note: The pre-loaded sample papers are fictional entities provided solely for demonstration purposes).*
