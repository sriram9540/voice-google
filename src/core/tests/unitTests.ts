/**
 * Automated Test Suite
 * Validates text refinement, self-correction, filler removal, list detection,
 * dictionary matching, snippet expansion, and provider switching.
 */

import { RefinementPipeline } from '../formatting/refinementPipeline';
import { providerManager } from '../providers/ProviderManager';
import { textInsertionService } from '../insertion/TextInsertionService';
import { DictionaryEntry, SnippetEntry } from '../../types';

export interface TestCaseResult {
  id: string;
  name: string;
  suite: string;
  passed: boolean;
  durationMs: number;
  expected?: string;
  actual?: string;
  error?: string;
}

export class TestRunner {
  public static async runAllTests(): Promise<{ passed: number; failed: number; results: TestCaseResult[] }> {
    const results: TestCaseResult[] = [];

    // --- Suite 1: Spoken Self-Correction / Backtracking ---
    results.push(this.testSelfCorrection());
    results.push(this.testScratchThatBacktracking());

    // --- Suite 2: Filler Word Removal ---
    results.push(this.testFillerRemovalConservative());
    results.push(this.testFillerRemovalAggressive());

    // --- Suite 3: Spoken Punctuation Commands ---
    results.push(this.testSpokenPunctuation());

    // --- Suite 4: Spoken List Formatting ---
    results.push(this.testNumberedListDetection());
    results.push(this.testBulletListDetection());

    // --- Suite 5: Personal Dictionary ---
    results.push(this.testDictionaryMatching());

    // --- Suite 6: Voice Snippet Expansion ---
    results.push(this.testSnippetExpansion());

    // --- Suite 7: Developer / Code Mode ---
    results.push(this.testDeveloperCamelCase());
    results.push(this.testDeveloperCliFlags());

    // --- Suite 8: Writing Style Transforms ---
    results.push(this.testFormalStyleTransform());
    results.push(this.testConciseStyleTransform());

    // --- Suite 9: Provider Manager & Switching ---
    results.push(await this.testProviderSwitching());

    // --- Suite 10: Text Insertion Strategy Fallback ---
    results.push(await this.testTextInsertionFallback());

    const passed = results.filter(r => r.passed).length;
    const failed = results.filter(r => !r.passed).length;

    return { passed, failed, results };
  }

  private static testSelfCorrection(): TestCaseResult {
    const start = performance.now();
    const input = 'Schedule the meeting for 2 pm actually 3 pm';
    const logs: string[] = [];
    const output = RefinementPipeline.applyBacktracking(input, logs);
    const expected = 'Schedule the meeting for 3 pm';
    const passed = output.trim() === expected;

    return {
      id: 'test-self-correction',
      name: 'Backtracking: "actually [new value]"',
      suite: 'Backtracking & Correction',
      passed,
      durationMs: Math.round(performance.now() - start),
      expected,
      actual: output
    };
  }

  private static testScratchThatBacktracking(): TestCaseResult {
    const start = performance.now();
    const input = 'Send this draft to marketing scratch that send to engineering';
    const logs: string[] = [];
    const output = RefinementPipeline.applyBacktracking(input, logs);
    const expected = 'send to engineering';
    const passed = output.trim() === expected;

    return {
      id: 'test-scratch-that',
      name: 'Backtracking: "scratch that [statement]"',
      suite: 'Backtracking & Correction',
      passed,
      durationMs: Math.round(performance.now() - start),
      expected,
      actual: output
    };
  }

  private static testFillerRemovalConservative(): TestCaseResult {
    const start = performance.now();
    const input = 'We should um deploy the uh release';
    const output = RefinementPipeline.removeFillerWords(input, 'conservative');
    const expected = 'We should deploy the release';
    const passed = output === expected;

    return {
      id: 'test-filler-conservative',
      name: 'Filler Removal: Conservative ("um", "uh")',
      suite: 'Filler Word Engine',
      passed,
      durationMs: Math.round(performance.now() - start),
      expected,
      actual: output
    };
  }

  private static testFillerRemovalAggressive(): TestCaseResult {
    const start = performance.now();
    const input = 'It was like basically kind of ready you know';
    const output = RefinementPipeline.removeFillerWords(input, 'aggressive');
    const expected = 'It was ready';
    const passed = output === expected;

    return {
      id: 'test-filler-aggressive',
      name: 'Filler Removal: Aggressive ("like", "basically", "you know")',
      suite: 'Filler Word Engine',
      passed,
      durationMs: Math.round(performance.now() - start),
      expected,
      actual: output
    };
  }

  private static testSpokenPunctuation(): TestCaseResult {
    const start = performance.now();
    const input = 'Hello world comma how are you question mark new line fine period';
    const rawPunct = RefinementPipeline.applySpokenPunctuation(input);
    const output = RefinementPipeline.cleanWhitespaceAndPunctuation(rawPunct);
    const expected = 'Hello world, how are you?\nFine.';
    const passed = output === expected;

    return {
      id: 'test-spoken-punctuation',
      name: 'Spoken Punctuation Commands ("comma", "period", "question mark")',
      suite: 'Punctuation Engine',
      passed,
      durationMs: Math.round(performance.now() - start),
      expected,
      actual: output
    };
  }

  private static testNumberedListDetection(): TestCaseResult {
    const start = performance.now();
    const input = 'items needed one apples two bananas three milk';
    const result = RefinementPipeline.applyListFormatting(input);
    const passed = result.detected && result.formatted.includes('1. Apples') && result.formatted.includes('2. Bananas');

    return {
      id: 'test-list-numbered',
      name: 'Numbered List Speech Parsing ("one apples two bananas...")',
      suite: 'List Formatting',
      passed,
      durationMs: Math.round(performance.now() - start),
      expected: 'Items needed:\n1. Apples\n2. Bananas\n3. Milk',
      actual: result.formatted
    };
  }

  private static testBulletListDetection(): TestCaseResult {
    const start = performance.now();
    const input = 'checklist bullet check logs bullet deploy backend bullet test routes';
    const result = RefinementPipeline.applyListFormatting(input);
    const passed = result.detected && result.formatted.includes('• Check logs') && result.formatted.includes('• Deploy backend');

    return {
      id: 'test-list-bullet',
      name: 'Bullet List Speech Parsing ("bullet item1 bullet item2")',
      suite: 'List Formatting',
      passed,
      durationMs: Math.round(performance.now() - start),
      expected: 'Checklist:\n• Check logs\n• Deploy backend\n• Test routes',
      actual: result.formatted
    };
  }

  private static testDictionaryMatching(): TestCaseResult {
    const start = performance.now();
    const dictionary: DictionaryEntry[] = [
      {
        id: '1',
        word: 'TypeScript',
        preferredCapitalization: 'TypeScript',
        aliases: ['type script'],
        isTechnical: true,
        createdAt: Date.now()
      },
      {
        id: '2',
        word: 'Kubernetes',
        preferredCapitalization: 'Kubernetes',
        aliases: ['k8s', 'coober netties'],
        isTechnical: true,
        createdAt: Date.now()
      }
    ];

    const input = 'we write type script and run on coober netties';
    const logs: string[] = [];
    const output = RefinementPipeline.applyDictionary(input, dictionary, logs);
    const expected = 'we write TypeScript and run on Kubernetes';
    const passed = output === expected;

    return {
      id: 'test-dictionary-matching',
      name: 'Personal Dictionary & Alias Replacement',
      suite: 'Dictionary Engine',
      passed,
      durationMs: Math.round(performance.now() - start),
      expected,
      actual: output
    };
  }

  private static testSnippetExpansion(): TestCaseResult {
    const start = performance.now();
    const snippets: SnippetEntry[] = [
      {
        id: 's1',
        triggerPhrase: 'my email signature',
        expansion: 'Best regards,\nJane Doe',
        description: 'Sig',
        enabled: true,
        isMultiline: true,
        createdAt: Date.now()
      }
    ];

    const input = 'Thanks for your time and my email signature';
    const logs: string[] = [];
    const output = RefinementPipeline.applySnippets(input, snippets, logs);
    const expected = 'Thanks for your time and Best regards,\nJane Doe';
    const passed = output === expected;

    return {
      id: 'test-snippet-expansion',
      name: 'Voice-Triggered Snippet Expansion',
      suite: 'Snippets Engine',
      passed,
      durationMs: Math.round(performance.now() - start),
      expected,
      actual: output
    };
  }

  private static testDeveloperCamelCase(): TestCaseResult {
    const start = performance.now();
    const input = 'declare camel case get user data function';
    const output = RefinementPipeline.applyDeveloperMode(input);
    const expected = 'declare getUserData()';
    const passed = output.trim() === expected;

    return {
      id: 'test-dev-camelcase',
      name: 'Developer Mode: camelCase & Function conversion',
      suite: 'Developer Mode',
      passed,
      durationMs: Math.round(performance.now() - start),
      expected,
      actual: output
    };
  }

  private static testDeveloperCliFlags(): TestCaseResult {
    const start = performance.now();
    const input = 'npm install flag save dev';
    const output = RefinementPipeline.applyDeveloperMode(input);
    const expected = 'npm install --save-dev';
    const passed = output.trim() === expected;

    return {
      id: 'test-dev-cliflags',
      name: 'Developer Mode: CLI Flag generation ("flag save dev" -> "--save-dev")',
      suite: 'Developer Mode',
      passed,
      durationMs: Math.round(performance.now() - start),
      expected,
      actual: output
    };
  }

  private static testFormalStyleTransform(): TestCaseResult {
    const start = performance.now();
    const input = "we can't and won't deploy tonight";
    const output = RefinementPipeline.applyStyleFormatting(input, 'formal');
    const expected = 'we cannot and will not deploy tonight';
    const passed = output === expected;

    return {
      id: 'test-style-formal',
      name: 'Style Transform: Formal (contraction expansion)',
      suite: 'Writing Styles',
      passed,
      durationMs: Math.round(performance.now() - start),
      expected,
      actual: output
    };
  }

  private static testConciseStyleTransform(): TestCaseResult {
    const start = performance.now();
    const input = 'i just wanted to say that the build is green';
    const output = RefinementPipeline.applyStyleFormatting(input, 'concise');
    const expected = 'the build is green';
    const passed = output === expected;

    return {
      id: 'test-style-concise',
      name: 'Style Transform: Concise (preamble stripping)',
      suite: 'Writing Styles',
      passed,
      durationMs: Math.round(performance.now() - start),
      expected,
      actual: output
    };
  }

  private static async testProviderSwitching(): Promise<TestCaseResult> {
    const start = performance.now();
    try {
      providerManager.setActiveProvider('local');
      const localProv = providerManager.getActiveProvider();
      const localCaps = localProv.getCapabilities();

      providerManager.setActiveProvider('direct_api');
      const directProv = providerManager.getActiveProvider();

      providerManager.setActiveProvider('huggingface');
      const hfProv = providerManager.getActiveProvider();

      // Reset back to local
      providerManager.setActiveProvider('local');

      const passed = localProv.id === 'local' &&
                     localCaps.localOffline === true &&
                     directProv.id === 'direct_api' &&
                     hfProv.id === 'huggingface';

      return {
        id: 'test-provider-switching',
        name: 'Provider Switching & Capability Contract',
        suite: 'AI Provider Architecture',
        passed,
        durationMs: Math.round(performance.now() - start),
        expected: 'Local, Direct API, and Hugging Face providers selectable',
        actual: `Resolved id: ${localProv.id}, ${directProv.id}, ${hfProv.id}`
      };
    } catch (e) {
      return {
        id: 'test-provider-switching',
        name: 'Provider Switching & Capability Contract',
        suite: 'AI Provider Architecture',
        passed: false,
        durationMs: Math.round(performance.now() - start),
        error: String(e)
      };
    }
  }

  private static async testTextInsertionFallback(): Promise<TestCaseResult> {
    const start = performance.now();
    try {
      // Test insertion into simulated test DOM element
      const dummyInput = document.createElement('input');
      dummyInput.type = 'text';
      dummyInput.value = 'Existing text ';
      document.body.appendChild(dummyInput);
      dummyInput.focus();

      const result = await textInsertionService.insertText('added speech', dummyInput);
      document.body.removeChild(dummyInput);

      return {
        id: 'test-insertion-fallback',
        name: 'Text Insertion Strategy Fallback & Execution',
        suite: 'Text Insertion Engine',
        passed: result.success,
        durationMs: Math.round(performance.now() - start),
        expected: 'Insertion successful via active strategy',
        actual: `Strategy used: ${result.strategyUsed}`
      };
    } catch (e) {
      return {
        id: 'test-insertion-fallback',
        name: 'Text Insertion Strategy Fallback & Execution',
        suite: 'Text Insertion Engine',
        passed: false,
        durationMs: Math.round(performance.now() - start),
        error: String(e)
      };
    }
  }
}
