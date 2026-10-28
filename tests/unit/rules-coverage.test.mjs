// Every rule the scanner can report must have Italian guidance, so no report shows English fallbacks.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import RULES from '../../src/data/rules.it.js';

const axe = createRequire(import.meta.url)('axe-core');
const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'];

test('every rule Varco runs has Italian guidance', () => {
  const run = axe.getRules(TAGS).filter((r) => !r.tags.includes('experimental') && r.ruleId !== 'frame-tested').map((r) => r.ruleId);
  const missing = run.filter((id) => !RULES[id]);
  assert.deepEqual(missing, [], `missing guidance for: ${missing.join(', ')}`);
});

test('guidance does not reference rules that axe does not have', () => {
  const known = new Set(axe.getRules().map((r) => r.ruleId));
  const unknown = Object.keys(RULES).filter((id) => !known.has(id));
  assert.deepEqual(unknown, []);
});
