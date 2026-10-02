/**
 * Core Transcript Refinement & Formatting Pipeline
 * Strictly provider-independent. Runs local deterministic rules and provides
 * structured requests for AI providers when enabled.
 */

import {
  RefinementRequest,
  RefinementResult,
  FillerRemovalLevel,
  WritingStyleId,
  SnippetEntry,
  DictionaryEntry
} from '../../types';

export class RefinementPipeline {
  /**
   * Main entry point for refining a raw transcript
   */
  public static process(request: RefinementRequest): RefinementResult {
    const startTime = performance.now();
    const correctionsApplied: string[] = [];
    const snippetsExpanded: string[] = [];
    let text = request.rawTranscript.trim();

    if (!text) {
      return {
        formattedText: '',
        confidence: 1.0,
        correctionsApplied: [],
        snippetsExpanded: [],
        detectedList: false,
        processingTimeMs: 0
      };
    }

    // 1. Spoken Backtracking / Self-Correction Engine
    if (request.detectBacktracking) {
      const beforeBacktrack = text;
      text = this.applyBacktracking(text, correctionsApplied);
      if (text !== beforeBacktrack) {
        correctionsApplied.push('Speech self-correction resolved');
      }
    }

    // 2. Filler Word Removal
    if (request.fillerRemovalLevel !== 'off') {
      const beforeFiller = text;
      text = this.removeFillerWords(text, request.fillerRemovalLevel);
      if (text !== beforeFiller) {
        correctionsApplied.push(`Filler words removed (${request.fillerRemovalLevel})`);
      }
    }

    // 3. Spoken Punctuation Commands
    if (request.spokenPunctuation) {
      const beforePunctuation = text;
      text = this.applySpokenPunctuation(text);
      if (text !== beforePunctuation) {
        correctionsApplied.push('Spoken punctuation commands converted');
      }
    }

    // 4. Voice-Triggered Snippet Expansion
    if (request.snippets && request.snippets.length > 0) {
      text = this.applySnippets(text, request.snippets, snippetsExpanded);
    }

    // 5. Personal Dictionary & Technical Vocabulary
    if (request.dictionary && request.dictionary.length > 0) {
      text = this.applyDictionary(text, request.dictionary, correctionsApplied);
    }

    // 6. Developer / Code Mode Formatting
    if (request.developerMode) {
      const beforeDev = text;
      text = this.applyDeveloperMode(text);
      if (text !== beforeDev) {
        correctionsApplied.push('Developer/code identifiers formatted');
      }
    }

    // 7. Spoken List Formatting
    let detectedList = false;
    if (request.autoListFormatting) {
      const listResult = this.applyListFormatting(text);
      if (listResult.detected) {
        text = listResult.formatted;
        detectedList = true;
        correctionsApplied.push('Structured list detected and formatted');
      }
    }

    // 8. Style & Polish Application
    text = this.applyStyleFormatting(text, request.style, request.context?.category);

    // 9. Standard Capitalization & Spacing Cleanup
    text = this.cleanWhitespaceAndPunctuation(text);

    const processingTimeMs = Math.round(performance.now() - startTime);

    return {
      formattedText: text,
      confidence: 0.98,
      correctionsApplied,
      snippetsExpanded,
      detectedList,
      processingTimeMs
    };
  }

  /**
   * Resolves self-correction / backtracking speech patterns:
   * e.g., "Schedule the meeting for 2 pm... actually 3 pm." -> "Schedule the meeting for 3 pm."
   * "Send to John scratch that send to Sarah" -> "send to Sarah"
   */
  public static applyBacktracking(text: string, correctionsLog: string[]): string {
    let result = text;

    // Pattern 1: "... scratch that [new text]"
    if (/\b(?:scratch that|never mind that|cancel that)\b/i.test(result)) {
      result = result.replace(/.*?\b(?:scratch that|never mind that|cancel that)\b\s*/i, '');
      correctionsLog.push('Scratched preceding statement');
      return result;
    }

    // Pattern 2: "... actually / I mean / correction / no rather / change that [replacement]"
    const correctionRegex = /(?:(\b\w+(?:\s+\w+){0,4})\s+(?:actually|i mean|correction|change that|no rather|instead)\s+(\b\w+(?:\s+\w+){0,4}))/i;
    
    // Iteratively resolve up to 3 self-corrections
    let iterations = 0;
    while (correctionRegex.test(result) && iterations < 3) {
      result = result.replace(correctionRegex, (_match, _preceding, replacement) => {
        return replacement;
      });
      iterations++;
    }

    return result;
  }

  /**
   * Filler word removal based on sensitivity level
   */
  public static removeFillerWords(text: string, level: FillerRemovalLevel): string {
    if (level === 'off') return text;

    let wordsToRemove: string[] = [];

    if (level === 'conservative') {
      wordsToRemove = ['\\bum\\b', '\\buh\\b', '\\ber\\b'];
    } else if (level === 'normal') {
      wordsToRemove = [
        '\\bum\\b', 
        '\\buh\\b', 
        '\\ber\\b', 
        '\\byou know\\b', 
        '(?<=,\\s*|\\A)like(?=\\s*,|\\s+\\w+)', 
        '\\bbasically\\b', 
        '\\bsort of\\b'
      ];
    } else if (level === 'aggressive') {
      wordsToRemove = [
        '\\bum\\b', 
        '\\buh\\b', 
        '\\ber\\b', 
        '\\byou know\\b', 
        '\\blike\\b', 
        '\\bbasically\\b', 
        '\\bsort of\\b',
        '\\bkind of\\b',
        '\\bi mean\\b',
        '\\bliterally\\b',
        '\\bi guess\\b'
      ];
    }

    let cleaned = text;
    for (const pattern of wordsToRemove) {
      cleaned = cleaned.replace(new RegExp(pattern, 'gi'), '');
    }

    // Clean up orphan commas and consecutive spaces
    cleaned = cleaned.replace(/\s+,/g, ',').replace(/\s{2,}/g, ' ').trim();
    return cleaned;
  }

  /**
   * Converts spoken punctuation cues into proper typographic marks
   */
  public static applySpokenPunctuation(text: string): string {
    let result = text;

    const punctuationRules: [RegExp, string][] = [
      [/\bnew paragraph\b/gi, '\n\n'],
      [/\bnew line\b|\bnewline\b/gi, '\n'],
      [/\bperiod\b|\bfull stop\b/gi, '.'],
      [/\bcomma\b/gi, ','],
      [/\bquestion mark\b/gi, '?'],
      [/\bexclamation mark\b|\bexclamation point\b/gi, '!'],
      [/\bcolon\b(?!\/\/)/gi, ':'],
      [/\bsemicolon\b|\bsemi colon\b/gi, ';'],
      [/\bopen quote\b|\bopen quotes\b/gi, ' "'],
      [/\bclose quote\b|\bclose quotes\b/gi, '" '],
      [/\bhyphen\b|\bdash\b/gi, '-'],
      [/\bellipsis\b|\bdot dot dot\b/gi, '...']
    ];

    for (const [regex, replacement] of punctuationRules) {
      result = result.replace(regex, replacement);
    }

    return result;
  }

  /**
   * Replaces trigger phrases with registered voice snippets
   */
  public static applySnippets(text: string, snippets: SnippetEntry[], expandedLog: string[]): string {
    let result = text;
    for (const snippet of snippets) {
      if (!snippet.enabled || !snippet.triggerPhrase) continue;

      const escapedTrigger = snippet.triggerPhrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`\\b${escapedTrigger}\\b`, 'i');

      if (regex.test(result)) {
        result = result.replace(regex, snippet.expansion);
        expandedLog.push(`Snippet: "${snippet.triggerPhrase}"`);
      }
    }
    return result;
  }

  /**
   * Applies personal dictionary capitalization and alias replacement
   */
  public static applyDictionary(text: string, dictionary: DictionaryEntry[], correctionsLog: string[]): string {
    let result = text;

    for (const entry of dictionary) {
      // 1. Check primary word capitalization
      const wordRegex = new RegExp(`\\b${entry.word}\\b`, 'gi');
      if (wordRegex.test(result)) {
        result = result.replace(wordRegex, entry.preferredCapitalization);
      }

      // 2. Check aliases
      if (entry.aliases && entry.aliases.length > 0) {
        for (const alias of entry.aliases) {
          const aliasRegex = new RegExp(`\\b${alias}\\b`, 'gi');
          if (aliasRegex.test(result)) {
            result = result.replace(aliasRegex, entry.preferredCapitalization);
            correctionsLog.push(`Dictionary alias: "${alias}" → "${entry.preferredCapitalization}"`);
          }
        }
      }
    }

    return result;
  }

  /**
   * Developer / Code mode formatting:
   * Recognizes identifiers like "camel case get user data", "snake case api key", "kebab case user profile"
   * or "npm install flag save dev"
   */
  public static applyDeveloperMode(text: string): string {
    let result = text;

    // "camel case [words]" -> camelCaseWords
    result = result.replace(/\bcamel\s*case\s+([a-zA-Z0-9\s]+?)(?=[,.;\n]|$)/gi, (_match, group) => {
      const words = group.trim().split(/\s+/);
      return words.map((w: string, i: number) => 
        i === 0 ? w.toLowerCase() : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()
      ).join('');
    });

    // "snake case [words]" -> snake_case_words
    result = result.replace(/\bsnake\s*case\s+([a-zA-Z0-9\s]+?)(?=[,.;\n]|$)/gi, (_match, group) => {
      return group.trim().toLowerCase().split(/\s+/).join('_');
    });

    // "kebab case [words]" -> kebab-case-words
    result = result.replace(/\bkebab\s*case\s+([a-zA-Z0-9\s]+?)(?=[,.;\n]|$)/gi, (_match, group) => {
      return group.trim().toLowerCase().split(/\s+/).join('-');
    });

    // "pascal case [words]" -> PascalCaseWords
    result = result.replace(/\bpascal\s*case\s+([a-zA-Z0-9\s]+?)(?=[,.;\n]|$)/gi, (_match, group) => {
      return group.trim().split(/\s+/).map((w: string) => 
        w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()
      ).join('');
    });

    // CLI flags: "flag save dev" -> "--save-dev", "flag p" -> "-p"
    result = result.replace(/\bflag\s+([a-zA-Z0-9\-]+)\b/gi, (_match, flag) => {
      return flag.length === 1 ? `-${flag}` : `--${flag}`;
    });

    // Functions: "function [name]" -> functionName()
    result = result.replace(/\b([a-zA-Z0-9_]+)\s+function\b/gi, '$1()');

    return result;
  }

  /**
   * Spoken list detection and conversion:
   * e.g., "things to buy one apples two bananas three milk" ->
   * "Things to buy:\n1. Apples\n2. Bananas\n3. Milk"
   */
  public static applyListFormatting(text: string): { formatted: string; detected: boolean } {
    // Numbered list spoken: "one ... two ... three ..."
    const numberedPattern = /\b(?:number\s+)?(one|1)\b\s+(.+?)\s+\b(?:number\s+)?(two|2)\b\s+(.+?)(?:\s+\b(?:number\s+)?(three|3)\b\s+(.+?))?(?=[.?!]|$)/i;
    const match = text.match(numberedPattern);

    if (match) {
      const intro = text.substring(0, match.index).trim();
      const item1 = match[2]?.trim();
      const item2 = match[4]?.trim();
      const item3 = match[6]?.trim();

      const items = [item1, item2, item3].filter(Boolean);
      const formattedItems = items.map((item, idx) => {
        const capitalized = (item ?? '').charAt(0).toUpperCase() + (item ?? '').slice(1);
        return `${idx + 1}. ${capitalized}`;
      }).join('\n');

      const prefix = intro ? `${intro}${intro.endsWith(':') ? '' : ':'}\n` : '';
      return {
        formatted: `${prefix}${formattedItems}`,
        detected: true
      };
    }

    // Bullet list spoken: "bullet ... bullet ... bullet ..."
    if (/\bbullet\b/i.test(text)) {
      const parts = text.split(/\bbullet\b/i);
      if (parts.length > 2) {
        const intro = parts[0].trim();
        const items = parts.slice(1).map(p => {
          const cleaned = p.trim().replace(/^[,.\s]+/, '');
          return `• ${cleaned.charAt(0).toUpperCase() + cleaned.slice(1)}`;
        }).join('\n');

        const prefix = intro ? `${intro}${intro.endsWith(':') ? '' : ':'}\n` : '';
        return {
          formatted: `${prefix}${items}`,
          detected: true
        };
      }
    }

    return { formatted: text, detected: false };
  }

  /**
   * Writing style adjustment
   */
  public static applyStyleFormatting(text: string, style: WritingStyleId, appCategory?: string): string {
    let result = text;

    // Context-sensitive default overrides
    if (appCategory === 'code_editor' || appCategory === 'terminal') {
      // Do not over-punctuate or force prose
      return result;
    }

    if (style === 'formal') {
      // Replace common contractions
      result = result
        .replace(/\bcan't\b/gi, 'cannot')
        .replace(/\bwon't\b/gi, 'will not')
        .replace(/\bdon't\b/gi, 'do not')
        .replace(/\bit's\b/gi, 'it is')
        .replace(/\bi'm\b/gi, 'I am')
        .replace(/\bgonna\b/gi, 'going to')
        .replace(/\bwanna\b/gi, 'want to');
    } else if (style === 'concise') {
      // Trim excessive intro phrases
      result = result
        .replace(/^(?:i just wanted to say that|i would like to mention that|as you may know)\s*/gi, '')
        .replace(/\bplease feel free to let me know if\b/gi, 'Let me know if');
    }

    return result;
  }

  /**
   * Whitespace, capitalization, and punctuation normalization
   */
  public static cleanWhitespaceAndPunctuation(text: string): string {
    let result = text;

    // Remove whitespace before punctuation
    result = result.replace(/\s+([.,!?:;])/g, '$1');

    // Ensure whitespace after punctuation if followed by word
    result = result.replace(/([.,!?:;])([a-zA-Z])/g, '$1 $2');

    // Clean duplicate punctuation
    result = result.replace(/([.,!?:;]){2,}/g, '$1');

    // Capitalize first character of sentences
    result = result.replace(/(^\s*|[.!?\n]\s+)([a-z])/g, (_match, separator, char) => {
      return separator + char.toUpperCase();
    });

    // Trim trailing/leading whitespace
    return result.trim();
  }
}
