const fs = require('fs');
const path = require('path');

const SNIPPETS_DIR = '/Users/anishmoonka/Desktop/gita_podcast/App_Snippets_Hindi';
const OUTPUT_FILE = path.join(__dirname, '..', 'data', 'gita_snippets_hindi.json');
const SHORT_REFLECTIONS_FILE = path.join(__dirname, '..', 'data', 'short_reflections_hindi.json');

function parseMarkdownFile(filePath, snippetId) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');

  const fileName = path.basename(filePath);
  const chapterMatch = fileName.match(/Ch(\d+)_Verses_(\d+)-(\d+)/);

  if (!chapterMatch) {
    console.error(`Could not parse filename: ${fileName}`);
    return null;
  }

  const chapter = parseInt(chapterMatch[1], 10);
  const verseStart = chapterMatch[2];
  const verseEnd = chapterMatch[3];
  const verses = `${chapter}.${verseStart} - ${chapter}.${verseEnd}`;

  let chapterTitle = '';
  let verseTitle = '';
  let sanskrit = '';
  let transliteration = '';
  let translation = '';
  let understanding = '';
  let reflection = '';

  let currentSection = '';
  let sectionContent = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Chapter title: # अध्याय १: अर्जुन विषाद योग
    if (line.startsWith('# अध्याय') || line.startsWith('# ')) {
      if (!line.startsWith('## ') && !line.startsWith('### ')) {
        const match = line.match(/# अध्याय \S+:\s*(.+)/);
        if (match) chapterTitle = match[1].trim();
        else {
          const simpleMatch = line.match(/# (.+)/);
          if (simpleMatch) chapterTitle = simpleMatch[1].trim();
        }
        continue;
      }
    }

    // Verse subtitle: ## श्लोक १-३: अंधे राजा का प्रश्न
    if (line.startsWith('## श्लोक') || line.startsWith('## ')) {
      if (!line.startsWith('### ')) {
        const match = line.match(/## श्लोक \S+:\s*(.+)/);
        if (match) verseTitle = match[1].trim();
        else {
          const simpleMatch = line.match(/## (.+)/);
          if (simpleMatch) verseTitle = simpleMatch[1].trim();
        }
        continue;
      }
    }

    // Section: ### श्लोक (verses)
    if (line.startsWith('### श्लोक')) {
      if (currentSection && sectionContent.length > 0) {
        saveSectionContent(currentSection, sectionContent);
      }
      currentSection = 'verses';
      sectionContent = [];
      continue;
    }

    // Section: ### अनुवाद (translation)
    if (line.startsWith('### अनुवाद')) {
      if (currentSection && sectionContent.length > 0) {
        saveSectionContent(currentSection, sectionContent);
      }
      currentSection = 'translation';
      sectionContent = [];
      continue;
    }

    // Section: ### इन श्लोकों को समझना (understanding/commentary)
    if (line.startsWith('### इन श्लोकों को समझना') || line.startsWith('### इस श्लोक को समझना')) {
      if (currentSection && sectionContent.length > 0) {
        saveSectionContent(currentSection, sectionContent);
      }
      currentSection = 'understanding';
      sectionContent = [];
      continue;
    }

    // Section: ### दैनिक अभ्यास के लिए चिंतन (reflection)
    if (line.startsWith('### दैनिक अभ्यास के लिए चिंतन') || line.startsWith('### चिंतन')) {
      if (currentSection && sectionContent.length > 0) {
        saveSectionContent(currentSection, sectionContent);
      }
      currentSection = 'reflection';
      sectionContent = [];
      continue;
    }

    if (line.trim() === '---') continue;
    if (line.includes('स्वामी चिन्मयानन्द')) continue;

    if (currentSection) {
      sectionContent.push(line);
    }
  }

  if (currentSection && sectionContent.length > 0) {
    saveSectionContent(currentSection, sectionContent);
  }

  function saveSectionContent(section, content) {
    const text = content.join('\n').trim();

    if (section === 'verses') {
      // Hindi verses use **श्लोक X:** format
      const verseBlocks = text.split(/\*\*श्लोक \S+:\*\*/);
      let allSanskrit = [];
      let allTranslit = [];

      for (const block of verseBlocks) {
        if (!block.trim()) continue;

        const sanskritLines = [];
        const translitLines = [];

        for (const line of block.split('\n')) {
          if (line.startsWith('>')) {
            sanskritLines.push(line.replace(/^>\s*/, '').trim());
          } else if (line.startsWith('*') && !line.startsWith('**')) {
            const cleaned = line.replace(/^\*|\*$/g, '').trim();
            if (cleaned) translitLines.push(cleaned);
          }
        }

        if (sanskritLines.length > 0) {
          allSanskrit.push(sanskritLines.join('\n'));
        }
        if (translitLines.length > 0) {
          allTranslit.push(translitLines.join('\n'));
        }
      }

      sanskrit = allSanskrit.join('\n\n');
      transliteration = allTranslit.join('\n\n');
    } else if (section === 'translation') {
      // Hindi translations use **श्लोक X:** format
      translation = text
        .replace(/\*\*श्लोक \S+:\*\*/g, '')
        .trim();
    } else if (section === 'understanding') {
      understanding = text;
    } else if (section === 'reflection') {
      reflection = text
        .replace(/\n*\*.*स्वामी चिन्मयानन्द.*\*\n*/gi, '')
        .trim();
    }
  }

  // Separate verse translations from commentary
  const fullText = translation + (understanding ? '\n\n' + understanding : '');
  const paragraphs = fullText.split(/\n\n+/).filter(p => p.trim());

  const verseTranslations = [];
  let commentaryStartIndex = 0;

  for (let i = 0; i < paragraphs.length; i++) {
    const para = paragraphs[i].trim();

    // In Hindi files, verse translations typically start with verse identifiers
    const isVerseTranslation =
      /^("|"|')/.test(para) ||
      /^\d+\.\d+[\.\s]/.test(para) ||
      /^श्लोक \d+:/i.test(para) ||
      /^(धृतराष्ट्र|संजय|कृष्ण|अर्जुन)\s+(ने कहा|ने उत्तर दिया|बोले)/i.test(para);

    const isShortEnough = para.length < 800;

    if (isVerseTranslation && isShortEnough && i < 10) {
      let cleaned = para
        .replace(/^श्लोक \S+:\s*/, '')
        .replace(/^\d+\.\d+[\.\s]*/, '')
        .trim();
      verseTranslations.push(cleaned);
      commentaryStartIndex = i + 1;
    } else if (verseTranslations.length > 0) {
      break;
    }
  }

  const commentary = paragraphs.slice(commentaryStartIndex).join('\n\n');

  const title = `दिन ${snippetId}: ${verseTitle || chapterTitle}`;

  return {
    id: snippetId,
    title,
    chapter,
    verses,
    sanskrit: sanskrit || 'संस्कृत पाठ उपलब्ध नहीं है',
    transliteration: transliteration || 'लिप्यंतरण उपलब्ध नहीं है',
    verseTranslations: verseTranslations.length > 0 ? verseTranslations : ['अनुवाद उपलब्ध नहीं है'],
    commentary: commentary || '',
    reflection: reflection || 'एक क्षण के लिए विचार करें कि ये शिक्षाएँ आज आपके जीवन में कैसे लागू होती हैं।'
  };
}

function getAllSnippetFiles() {
  const chapters = fs.readdirSync(SNIPPETS_DIR)
    .filter(f => f.startsWith('Chapter_'))
    .sort((a, b) => {
      const numA = parseInt(a.replace('Chapter_', ''), 10);
      const numB = parseInt(b.replace('Chapter_', ''), 10);
      return numA - numB;
    });

  const allFiles = [];

  for (const chapter of chapters) {
    const chapterPath = path.join(SNIPPETS_DIR, chapter);
    const files = fs.readdirSync(chapterPath)
      .filter(f => f.endsWith('.md'))
      .sort((a, b) => {
        const matchA = a.match(/Verses_(\d+)/);
        const matchB = b.match(/Verses_(\d+)/);
        if (matchA && matchB) {
          return parseInt(matchA[1], 10) - parseInt(matchB[1], 10);
        }
        return a.localeCompare(b);
      });

    for (const file of files) {
      allFiles.push(path.join(chapterPath, file));
    }
  }

  return allFiles;
}

function main() {
  console.log('Parsing Hindi snippets from:', SNIPPETS_DIR);

  const files = getAllSnippetFiles();
  console.log(`Found ${files.length} snippet files`);

  const snippets = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const snippetId = i + 1;

    try {
      const snippet = parseMarkdownFile(file, snippetId);
      if (snippet) {
        snippets.push(snippet);
        if (snippetId % 50 === 0) {
          console.log(`Processed ${snippetId} snippets...`);
        }
      }
    } catch (err) {
      console.error(`Error parsing ${file}:`, err.message);
    }
  }

  console.log(`\nSuccessfully parsed ${snippets.length} snippets`);

  // Merge short reflections if available
  if (fs.existsSync(SHORT_REFLECTIONS_FILE)) {
    const shortReflections = JSON.parse(fs.readFileSync(SHORT_REFLECTIONS_FILE, 'utf-8'));
    const reflectionMap = {};
    for (const r of shortReflections) {
      reflectionMap[r.day] = r.shortReflection;
    }
    for (const snippet of snippets) {
      if (reflectionMap[snippet.id]) {
        snippet.shortReflection = reflectionMap[snippet.id];
      }
    }
    console.log(`Merged ${Object.keys(reflectionMap).length} short reflections`);
  }

  const output = { snippets };
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2));
  console.log(`Output written to: ${OUTPUT_FILE}`);

  // Print sample
  console.log('\n=== Sample snippet (first) ===');
  const s = snippets[0];
  console.log('Title:', s.title);
  console.log('Verse translations:', s.verseTranslations.length);
  s.verseTranslations.forEach((t, i) => console.log(`  [${i}]: ${t.substring(0, 100)}...`));
  console.log('Commentary length:', s.commentary.length);
  console.log('Has shortReflection:', !!s.shortReflection);
}

main();
