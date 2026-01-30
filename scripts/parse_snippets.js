const fs = require('fs');
const path = require('path');

const SNIPPETS_DIR = '/Users/anishmoonka/Desktop/gita_podcast/App_Snippets';
const OUTPUT_FILE = path.join(__dirname, '..', 'data', 'gita_snippets.json');

function parseMarkdownFile(filePath, snippetId) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');

  // Extract chapter number from filename
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

  // Parse sections
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

    if (line.startsWith('# Chapter')) {
      const match = line.match(/# Chapter \d+: (.+)/);
      if (match) chapterTitle = match[1].trim();
      continue;
    }

    if (line.startsWith('## Verses')) {
      const match = line.match(/## Verses [\d-]+: (.+)/);
      if (match) verseTitle = match[1].trim();
      continue;
    }

    if (line.startsWith('### The Verses')) {
      if (currentSection && sectionContent.length > 0) {
        saveSectionContent(currentSection, sectionContent);
      }
      currentSection = 'verses';
      sectionContent = [];
      continue;
    }

    if (line.startsWith('### Translation')) {
      if (currentSection && sectionContent.length > 0) {
        saveSectionContent(currentSection, sectionContent);
      }
      currentSection = 'translation';
      sectionContent = [];
      continue;
    }

    if (line.startsWith('### Understanding')) {
      if (currentSection && sectionContent.length > 0) {
        saveSectionContent(currentSection, sectionContent);
      }
      currentSection = 'understanding';
      sectionContent = [];
      continue;
    }

    if (line.startsWith('### Reflections')) {
      if (currentSection && sectionContent.length > 0) {
        saveSectionContent(currentSection, sectionContent);
      }
      currentSection = 'reflection';
      sectionContent = [];
      continue;
    }

    if (line.trim() === '---') continue;
    if (line.includes('Inspired by the teachings of Swami Chinmayananda')) continue;
    if (line.includes('Based on the teachings of Swami Chinmayananda')) continue;
    if (line.match(/^\*.*Swami Chinmayananda.*\*$/)) continue;

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
      const verseBlocks = text.split(/\*\*Verse \d+:\*\*/);
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
      translation = text
        .replace(/\*\*Verse \d+\.\d+:\*\*/g, '')
        .replace(/\*\*Verse \d+:\*\*/g, '')
        .trim();
    } else if (section === 'understanding') {
      understanding = text;
    } else if (section === 'reflection') {
      // Clean up reflection - remove attribution lines
      reflection = text
        .replace(/\n*\*.*Swami Chinmayananda.*\*\n*/gi, '')
        .replace(/\n*Based on the teachings of Swami Chinmayananda\n*/gi, '')
        .replace(/\n*Inspired by the teachings of Swami Chinmayananda\n*/gi, '')
        .trim();
    }
  }

  // Now separate verse translations from commentary
  // Verse translations are usually the first paragraphs that:
  // - Start with quotes, OR
  // - Start with verse numbers like "1.4." or just numbers
  // - Are relatively short (under 500 chars typically)

  const fullText = translation + (understanding ? '\n\n' + understanding : '');
  const paragraphs = fullText.split(/\n\n+/).filter(p => p.trim());

  const verseTranslations = [];
  let commentaryStartIndex = 0;

  for (let i = 0; i < paragraphs.length; i++) {
    const para = paragraphs[i].trim();

    // Check if this looks like a verse translation
    const isVerseTranslation =
      // Starts with a quote
      (para.startsWith('"') || para.startsWith('"') || para.startsWith("'")) ||
      // Starts with verse number like "1.4." or "2.1"
      /^\d+\.\d+[\.\s]/.test(para) ||
      // Contains "said:" pattern at the start (like "Dhritarashtra said:")
      /^[A-Z][a-z]+ (said|replied|spoke|answered):/i.test(para);

    // Also check it's not too long (translations are usually concise)
    const isShortEnough = para.length < 600;

    if (isVerseTranslation && isShortEnough && i < 10) {
      // Clean up the verse translation
      let cleaned = para
        .replace(/^\d+\.\d+[\.\s]*/, '') // Remove verse number prefix
        .trim();
      verseTranslations.push(cleaned);
      commentaryStartIndex = i + 1;
    } else if (verseTranslations.length > 0) {
      // Once we hit non-translation content, stop
      break;
    }
  }

  // Get the commentary (everything after verse translations)
  const commentary = paragraphs.slice(commentaryStartIndex).join('\n\n');

  const title = `Day ${snippetId}: ${verseTitle || chapterTitle}`;

  return {
    id: snippetId,
    title,
    chapter,
    verses,
    sanskrit: sanskrit || 'Sanskrit text not available',
    transliteration: transliteration || 'Transliteration not available',
    verseTranslations: verseTranslations.length > 0 ? verseTranslations : ['Translation not available'],
    commentary: commentary || '',
    reflection: reflection || 'Take a moment to reflect on how these teachings apply to your life today.'
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
  console.log('Parsing snippets from:', SNIPPETS_DIR);

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

  const output = { snippets };
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2));
  console.log(`Output written to: ${OUTPUT_FILE}`);

  // Print sample
  console.log('\n=== Sample snippet (first) ===');
  const s = snippets[0];
  console.log('Title:', s.title);
  console.log('Verse translations:', s.verseTranslations.length);
  s.verseTranslations.forEach((t, i) => console.log(`  [${i}]: ${t.substring(0, 80)}...`));
  console.log('Commentary length:', s.commentary.length);
}

main();
