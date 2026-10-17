const $ = (selector) => document.querySelector(selector);
const papers = [];
let currentReview = '';

const samplePapers = [
  {
    title: 'Deep Learning for Medical Image Classification',
    authors: 'Sample Author A, Sample Author B',
    year: 2023,
    journal: 'Sample Medical AI Journal',
    keywords: 'deep learning, medical imaging, CNN, healthcare',
    abstract: 'This illustrative sample study explores deep learning methods for classifying medical images. It describes convolutional neural networks and discusses accuracy, dataset size, and generalization. The example highlights the importance of representative data and careful evaluation when developing medical AI systems.'
  },
  {
    title: 'Natural Language Processing for Clinical Text',
    authors: 'Sample Author C, Sample Author D',
    year: 2024,
    journal: 'Sample NLP Journal',
    keywords: 'NLP, clinical text, transformers, healthcare',
    abstract: 'This illustrative sample study examines natural language processing for clinical text analysis. It discusses transformer models, information extraction, and challenges involving specialized medical language. The example emphasizes the need to assess data quality, privacy, and performance across different clinical settings.'
  },
  {
    title: 'Ethical Challenges in Artificial Intelligence for Healthcare',
    authors: 'Sample Author E',
    year: 2024,
    journal: 'Sample AI Ethics Journal',
    keywords: 'ethics, healthcare, privacy, responsible AI',
    abstract: 'This illustrative sample study considers privacy, fairness, interpretability, and responsible deployment of artificial intelligence in healthcare settings. It identifies governance and transparency as important considerations. The sample also points to the need for careful evaluation before AI tools are used in high-stakes environments.'
  }
];

function escapeHTML(value) {
  return String(value ?? '').replace(/[&<>"']/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[character]));
}

function showToast(message) {
  const toast = $('#toast');
  toast.textContent = message;
  toast.classList.add('show');
  window.setTimeout(() => toast.classList.remove('show'), 2600);
}

function getKeywords(paper) {
  return paper.keywords.split(',').map(word => word.trim().toLowerCase()).filter(Boolean);
}

function renderPapers() {
  $('#paperCount').textContent = papers.length;
  $('#listCount').textContent = papers.length;
  $('#themeCount').textContent = new Set(papers.flatMap(getKeywords)).size;
  const years = papers.map(paper => Number(paper.year)).filter(Number.isFinite);
  $('#yearSpan').textContent = years.length ? `${Math.min(...years)}–${Math.max(...years)}` : '—';

  if (!papers.length) {
    $('#paperList').innerHTML = '<div class="empty-state"><div class="empty-icon">▤</div><strong>Your library is empty</strong><p>Add a paper above or load sample records to try the workspace.</p></div>';
    $('#reviewStatus').textContent = 'Not started';
    renderInsights();
    return;
  }

  $('#paperList').innerHTML = papers.map((paper, index) => `
    <article class="paper-item">
      <div class="paper-number">${String(index + 1).padStart(2, '0')}</div>
      <div class="paper-info">
        <strong>${escapeHTML(paper.title)}</strong>
        <div class="paper-meta">${escapeHTML(paper.authors || 'Author not supplied')} · ${escapeHTML(paper.year || 'Year not supplied')}${paper.journal ? ' · ' + escapeHTML(paper.journal) : ''}</div>
        ${paper.journal ? '' : ''}
        ${paper.keywords ? `<div class="paper-keywords"><strong>Keywords:</strong> ${escapeHTML(paper.keywords)}</div>` : ''}
        <details class="paper-abstract-details">
          <summary>View abstract</summary>
          <p>${escapeHTML(paper.abstract)}</p>
        </details>
      </div>
      <button type="button" class="remove-paper" data-remove="${index}" aria-label="Remove ${escapeHTML(paper.title)}" title="Remove paper">×</button>
    </article>`).join('');

  $('#paperList').querySelectorAll('[data-remove]').forEach(button => {
    button.addEventListener('click', () => {
      papers.splice(Number(button.dataset.remove), 1);
      currentReview = '';
      clearReview();
      renderPapers();
      showToast('Paper removed from your library.');
    });
  });
  renderInsights();
}

function renderInsights() {
  if (!papers.length) {
    $('#insights').innerHTML = '<div class="insight-placeholder">Your theme and publication insights will appear here after you add papers.</div>';
    return;
  }
  const counts = new Map();
  papers.forEach(paper => getKeywords(paper).forEach(keyword => counts.set(keyword, (counts.get(keyword) || 0) + 1)));
  const topThemes = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
  const max = Math.max(1, ...topThemes.map(item => item[1]));
  const themeMarkup = topThemes.map(([keyword, count]) => `
    <div><div class="insight-label"><span>${escapeHTML(keyword)}</span><strong>${count} paper${count === 1 ? '' : 's'}</strong></div>
    <div class="bar-track"><div class="bar-fill" style="width:${(count / max) * 100}%"></div></div></div>`).join('');
  const years = papers.map(paper => Number(paper.year)).filter(Number.isFinite);
  const publicationCoverage = years.length ? `${Math.min(...years)}–${Math.max(...years)}` : 'Year not supplied';
  $('#insights').innerHTML = `${themeMarkup}<div class="year-insight"><span>Publication coverage</span><strong>${publicationCoverage}</strong></div>`;
}

const paperFileInput = $('#paperFile');
if (paperFileInput) {
  paperFileInput.addEventListener('change', async event => {
    const file = event.target.files && event.target.files[0];
    const status = $('#fileStatus');
    if (!file) {
      status.textContent = 'No file selected.';
      return;
    }

    const extension = file.name.split('.').pop().toLowerCase();
    status.textContent = `Reading ${file.name}…`;

    try {
      let extractedText = '';
      if (['txt', 'md', 'markdown'].includes(extension)) {
        extractedText = await file.text();
      } else if (extension === 'pdf') {
        const formData = new FormData();
        formData.append('file', file);
        const response = await fetch('/extract-pdf', { method: 'POST', body: formData });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Could not extract text from this PDF.');
        extractedText = result.text || '';
      } else {
        throw new Error('Unsupported file type. Choose a .txt, .md, or text-based .pdf file.');
      }

      extractedText = extractedText.trim();
      if (!extractedText) {
        throw new Error('No selectable text was found. Scanned PDFs need OCR first.');
      }

      const filenameTitle = file.name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ').trim().slice(0, 250);
      const existingTitle = $('#title').value.trim();
      const title = filenameTitle || existingTitle || 'Imported research paper';
      const abstract = extractedText.slice(0, 12000);
      // Use a year found in the filename or extracted text. Never invent a year.
      const yearMatch = `${file.name}\n${extractedText}`.match(/\b(?:19|20)\d{2}\b/);
      const year = yearMatch ? Number(yearMatch[0]) : null;

      // Fill the form as well, so the selected file and its details remain visible.
      $('#title').value = title;
      $('#abstract').value = abstract;
      if (year) $('#year').value = year;

      const paper = {
        title,
        authors: $('#authors').value,
        year,
        journal: $('#journal').value,
        keywords: $('#keywords').value,
        abstract
      };

      const duplicate = papers.some(existing =>
        existing.title.toLowerCase() === paper.title.toLowerCase() &&
        existing.abstract === paper.abstract
      );
      if (duplicate) {
        status.textContent = `${file.name} is already in Added papers.`;
        showToast('This paper is already in your library.');
        return;
      }

      const added = addPaper(paper, { allowMissingYear: true });
      if (!added) throw new Error('The file was read, but the paper could not be added.');

      status.textContent = `Added ${file.name} to Added papers. The filename remains selected above.`;
      showToast('Paper imported and added to your library.');
    } catch (error) {
      status.textContent = error.message || 'Could not read this file.';
      showToast(status.textContent);
    }
  });
}

function addPaper(paper, options = {}) {
  const title = String(paper.title || '').trim();
  const abstract = String(paper.abstract || '').trim();
  const rawYear = paper.year;
  const year = rawYear === null || rawYear === undefined || rawYear === '' ? null : Number(rawYear);
  const validYear = year === null
    ? Boolean(options.allowMissingYear)
    : Number.isInteger(year) && year >= 1900 && year <= 2100;

  if (!title || !abstract || !validYear) {
    showToast('Please provide a title, abstract, and valid publication year.');
    return false;
  }
  papers.push({
    title,
    authors: String(paper.authors || '').trim(),
    year,
    journal: String(paper.journal || '').trim(),
    keywords: String(paper.keywords || '').trim(),
    abstract
  });
  currentReview = '';
  clearReview();
  renderPapers();
  return true;
}

$('#paperForm').addEventListener('submit', event => {
  event.preventDefault();
  const formData = new FormData(event.currentTarget);
  const added = addPaper({
    title: formData.get('title'),
    authors: formData.get('authors'),
    year: formData.get('year'),
    journal: formData.get('journal'),
    keywords: formData.get('keywords'),
    abstract: formData.get('abstract')
  });
  if (added) {
    event.currentTarget.reset();
    showToast('Research paper added.');
  }
});

$('#loadSamples').addEventListener('click', () => {
  samplePapers.forEach(paper => {
    if (!papers.some(existing => existing.title === paper.title)) addPaper(paper);
  });
  renderPapers();
  showToast('Illustrative sample records loaded. They are not real publications.');
});

function splitSentences(text) {
  return (String(text || '').replace(/\s+/g, ' ').match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [])
    .map(sentence => sentence.trim())
    .filter(sentence => sentence.length > 25);
}

function countWords(text) {
  return (String(text || '').match(/\b[\w'-]+\b/g) || []).length;
}

const STOP_WORDS = new Set((
  'a an the and or but if then than so because as at by for from in into of on onto to with within without '
  + 'is are was were be been being it its this that these those we our they their you your i he she his her '
  + 'can could may might will would should also such not no do does did have has had use used using based '
  + 'study paper research result results approach method methods show shows shown found find findings '
  + 'which who whom what when where how more most less many much other another each both across about '
  + 'their there here between through during after before over under first second third several however '
  + 'therefore thus overall important significant aim aims objective objectives'.split(' ').join(' ')
).split(/\s+/));

function tokenize(text) {
  return (String(text || '').toLowerCase().match(/[a-z][a-z0-9-]{2,}/g) || [])
    .filter(word => !STOP_WORDS.has(word) && !/^\d+$/.test(word));
}

function extractiveSummary(text, maxSentences = 3) {
  const sentences = splitSentences(text);
  if (sentences.length <= maxSentences) return sentences.join(' ');
  const frequencies = new Map();
  tokenize(text).forEach(word => frequencies.set(word, (frequencies.get(word) || 0) + 1));
  const maxFrequency = Math.max(1, ...frequencies.values());
  const scored = sentences.map((sentence, index) => {
    const words = tokenize(sentence);
    const lexicalScore = words.reduce((sum, word) => sum + (frequencies.get(word) || 0) / maxFrequency, 0) / Math.max(1, words.length);
    const cueScore = /\b(we propose|this paper|this study|we present|results indicate|findings suggest|in this work|we evaluate|we investigate|we examine|conclude|limitation)\b/i.test(sentence) ? 0.18 : 0;
    const positionScore = index === 0 ? 0.12 : 0;
    return { sentence, index, score: lexicalScore + cueScore + positionScore };
  });
  return scored.sort((a, b) => b.score - a.score).slice(0, maxSentences)
    .sort((a, b) => a.index - b.index).map(item => item.sentence).join(' ');
}

function summarizeAbstract(abstract) {
  return extractiveSummary(abstract, 3) || 'No readable abstract text was supplied for this paper.';
}

function buildReview() {
  const topic = $('#topic').value.trim() || 'the selected research area';
  const years = papers.map(paper => Number(paper.year)).filter(year => Number.isInteger(year) && year >= 1900 && year <= 2100);
  const firstYear = years.length ? Math.min(...years) : null;
  const lastYear = years.length ? Math.max(...years) : null;
  const yearRange = years.length ? `${firstYear}–${lastYear}` : 'not supplied';

  const keywordCounts = new Map();
  const abstractTermCounts = new Map();
  papers.forEach(paper => {
    getKeywords(paper).forEach(keyword => {
      if (keyword) keywordCounts.set(keyword, (keywordCounts.get(keyword) || 0) + 1);
    });
    [...new Set(tokenize(`${paper.title} ${paper.abstract}`))].forEach(term => {
      abstractTermCounts.set(term, (abstractTermCounts.get(term) || 0) + 1);
    });
  });
  const themes = [...keywordCounts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  const repeatedTerms = [...abstractTermCounts.entries()]
    .filter(([term, count]) => count > 1 && term.length > 3)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 10);
  const sharedThemes = themes.filter(([, count]) => count > 1).map(([keyword]) => keyword);
  const journalCounts = new Map();
  papers.forEach(paper => {
    if (paper.journal) journalCounts.set(paper.journal, (journalCounts.get(paper.journal) || 0) + 1);
  });

  const allAbstractWords = papers.reduce((sum, paper) => sum + countWords(paper.abstract), 0);
  const averageAbstractWords = Math.round(allAbstractWords / Math.max(1, papers.length));
  const sections = [];

  sections.push({
    title: '1. Introduction',
    paragraphs: [
      `This literature review examines ${topic} using ${papers.length} paper${papers.length === 1 ? '' : 's'} currently included in the workspace. The supplied publication years span ${yearRange}. The synthesis organizes the available paper text and metadata into individual summaries, recurring topics, publication coverage, and questions for further investigation.`,
      `The evidence base is limited to the text extracted from each uploaded file or the abstract entered by the researcher. Because full-text extraction may include front matter, references, headers, or incomplete passages, the review should be treated as a working draft rather than a systematic review or a verified account of the entire field.`
    ]
  });

  sections.push({
    title: '2. Paper Summaries',
    papers: papers.map((paper, index) => ({
      title: paper.title,
      text: summarizeAbstract(paper.abstract),
      meta: `${paper.authors || 'Author details not supplied'} (${paper.year || 'year not supplied'})${paper.journal ? ' · ' + paper.journal : ''}${paper.keywords ? ' · Keywords: ' + paper.keywords : ''}`
    }))
  });

  const themeParagraphs = [];
  if (themes.length) {
    themeParagraphs.push(`The user-supplied keywords most frequently represented in the library are ${themes.slice(0, 8).map(([keyword, count]) => `“${keyword}” (${count} paper${count === 1 ? '' : 's'})`).join(', ')}. ${sharedThemes.length ? `The repeated keywords are ${sharedThemes.map(theme => `“${theme}”`).join(', ')}; these provide a starting point for comparing papers that may address related concepts.` : 'No exact keyword is shared across multiple papers, so keyword metadata alone does not establish a common theme.'}`);
  } else {
    themeParagraphs.push('No keywords were supplied. Theme analysis therefore relies on repeated terms in the extracted titles and text, which can be noisy and should be checked by a researcher.');
  }
  if (repeatedTerms.length) {
    themeParagraphs.push(`Terms recurring across multiple paper texts include ${repeatedTerms.slice(0, 8).map(([term, count]) => `“${term}” (${count} papers)`).join(', ')}. This is a lexical overlap signal, not proof that the papers use these terms in the same way or agree in their findings.`);
  } else {
    themeParagraphs.push('The available texts did not provide a strong repeated-term signal. Consider adding more papers, complete abstracts, and consistent keywords to improve comparison.');
  }
  sections.push({
    title: '3. Theme Analysis',
    paragraphs: themeParagraphs,
    list: themes.slice(0, 10).map(([keyword, count]) => `${keyword}: supplied for ${count} paper${count === 1 ? '' : 's'}`)
  });

  const journalText = journalCounts.size
    ? `The journal or conference labels recorded are ${[...journalCounts.entries()].map(([journal, count]) => `${journal} (${count})`).join('; ')}.`
    : 'No journal or conference names were supplied for the papers.';
  const authorCount = papers.filter(paper => paper.authors.trim()).length;
  sections.push({
    title: '4. Publication and Citation Overview',
    paragraphs: [
      `${years.length ? `Publication years with usable values range from ${firstYear} to ${lastYear}` : 'Publication years are not available in a usable form'}; ${years.length} of ${papers.length} paper records have a publication year. The average extracted text length is approximately ${averageAbstractWords} words per paper, although uploaded PDFs may contain full-text material rather than abstracts alone.`,
      journalText,
      `${authorCount} of ${papers.length} records include author information. This workspace has not queried an external citation index, resolved DOI metadata, or checked the reference lists; consequently, citation counts, citation impact, and citation relationships cannot be reported reliably here.`
    ]
  });

  const gapCandidates = [];
  if (papers.length < 5) gapCandidates.push(`Coverage is limited to ${papers.length} paper${papers.length === 1 ? '' : 's'}. Search for additional relevant studies using a documented search strategy before making field-wide claims.`);
  if (!sharedThemes.length) gapCandidates.push('Keywords do not repeat across multiple records. Standardize terminology and compare the papers’ research questions, methods, datasets, and outcomes to identify genuine conceptual overlap.');
  if (years.length < papers.length) gapCandidates.push(`${papers.length - years.length} record${papers.length - years.length === 1 ? ' has' : 's have'} no usable publication year. Verify publication dates from the publisher or original paper.`);
  if (years.length && lastYear - firstYear < 5) gapCandidates.push(`The recorded publication span is ${firstYear}–${lastYear}. Check whether foundational work and newer studies outside this interval should be included.`);
  const abstractsShort = papers.filter(paper => countWords(paper.abstract) < 50).length;
  if (abstractsShort) gapCandidates.push(`${abstractsShort} paper record${abstractsShort === 1 ? ' contains' : 's contain'} fewer than 50 words of text. More complete abstracts or full-text sections are needed to compare methods, results, and limitations.`);
  gapCandidates.push('Substantive research gaps cannot be confirmed from keyword counts alone. Read the full studies and compare their stated limitations, populations or datasets, evaluation methods, and conflicting results before naming a gap.');
  sections.push({ title: '5. Potential Research Gaps', list: gapCandidates });

  sections.push({
    title: '6. Conclusion',
    paragraphs: [
      `The current library provides an initial evidence map for ${topic}. The summaries preserve selected sentences from the supplied text, while the theme analysis identifies repeated metadata and vocabulary that can guide closer reading. These patterns are exploratory and should not be interpreted as evidence of consensus or causal relationships.`,
      'Before academic submission, verify each paper’s bibliographic information, replace any incomplete extracted text with the official abstract, read the full studies, add properly formatted and verified references, and revise the synthesis to compare methods and findings directly. The present tool does not independently verify sources or generate externally validated citations.'
    ]
  });
  return sections;
}

function renderReview(sections) {
  const output = sections.map(section => {
    let content = `<section class="review-section"><h3>${escapeHTML(section.title)}</h3>`;
    if (section.paragraphs) content += section.paragraphs.map(paragraph => `<p>${escapeHTML(paragraph)}</p>`).join('');
    if (section.papers) content += section.papers.map((paper, index) => `<p><strong>${index + 1}. ${escapeHTML(paper.title)}</strong><br><span style="color:var(--muted)">${escapeHTML(paper.meta)}</span><br>${escapeHTML(paper.text)}</p>`).join('');
    if (section.list) content += `<ul>${section.list.map(item => `<li>${escapeHTML(item)}</li>`).join('')}</ul>`;
    content += '</section>';
    return content;
  }).join('');
  $('#reviewOutput').innerHTML = `<div class="review-badge">DRAFT · VERIFY SOURCES BEFORE USE</div>${output}`;
  const plainText = sections.map(section => {
    let text = section.title + '\n';
    if (section.paragraphs) text += section.paragraphs.join('\n\n') + '\n';
    if (section.papers) text += section.papers.map((paper, index) => `${index + 1}. ${paper.title}\n${paper.meta}\n${paper.text}`).join('\n\n') + '\n';
    if (section.list) text += section.list.map(item => `- ${item}`).join('\n') + '\n';
    return text;
  }).join('\n');
  currentReview = `LITERATURE REVIEW DRAFT\n\n${plainText}\n\nNote: This review was generated from user-supplied metadata and abstracts using basic heuristic methods. Sample records, if used, are illustrative and not real publications. Verify all sources and conclusions before academic use.`;
  $('#reviewSubtitle').textContent = `${papers.length} paper${papers.length === 1 ? '' : 's'} analyzed · ${countWords(currentReview)} words · Draft`;
  $('#reviewStatus').textContent = 'Draft ready';
  $('#copyReview').disabled = false;
  $('#downloadReview').disabled = false;
}

function clearReview() {
  $('#reviewOutput').innerHTML = '<div class="empty-review"><div class="empty-icon large">✧</div><h3>Your research synthesis starts here</h3><p>Add papers, then select “Generate literature review”.</p></div>';
  $('#reviewSubtitle').textContent = 'Your generated review will appear here.';
  $('#copyReview').disabled = true;
  $('#downloadReview').disabled = true;
  $('#reviewStatus').textContent = 'Not started';
}

$('#generateButton').addEventListener('click', () => {
  const button = $('#generateButton');
  const reviewPanel = $('#review');
  const reviewOutput = $('#reviewOutput');

  if (!papers.length) {
    showToast('Add at least one paper before generating a review.');
    $('#title').focus();
    return;
  }

  button.disabled = true;
  const originalButtonText = button.innerHTML;
  button.innerHTML = '<span>…</span> Generating review…';

  try {
    const sections = buildReview();
    if (!Array.isArray(sections) || sections.length === 0) {
      throw new Error('The review generator returned no sections.');
    }
    renderReview(sections);
    // Keep Step 03 visible and bring the completed result into view.
    reviewPanel.hidden = false;
    reviewPanel.style.display = 'block';
    reviewPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
    showToast('Literature review draft generated.');
  } catch (error) {
    console.error('Literature review generation failed:', error);
    reviewPanel.hidden = false;
    reviewPanel.style.display = 'block';
    reviewOutput.innerHTML = `<div class="generation-error"><h3>Review generation failed</h3><p>${escapeHTML(error.message || 'An unexpected error occurred.')}</p><p>Check the browser console for details, then try again.</p></div>`;
    reviewPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
    showToast('Could not generate the review. See the error in Step 03.');
  } finally {
    button.disabled = false;
    button.innerHTML = originalButtonText;
  }
});

$('#copyReview').addEventListener('click', async () => {
  if (!currentReview) return;
  try {
    await navigator.clipboard.writeText(currentReview);
    showToast('Review copied to clipboard.');
  } catch {
    showToast('Clipboard access is unavailable. Use Download .txt instead.');
  }
});

$('#downloadReview').addEventListener('click', () => {
  if (!currentReview) return;
  const blob = new Blob([currentReview], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'literature-review-draft.txt';
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  showToast('Review download started.');
});

$('#themeToggle').addEventListener('click', () => {
  document.body.classList.toggle('dark');
  $('#themeToggle').textContent = document.body.classList.contains('dark') ? '☾' : '☼';
});

renderPapers();
