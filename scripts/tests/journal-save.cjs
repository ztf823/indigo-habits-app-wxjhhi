const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

// Exercise the actual save controller with deferred storage, without native UI.
const source = fs.readFileSync(path.join(__dirname, '../../app/(tabs)/(home)/index.tsx'), 'utf8');
const start = source.indexOf('  const saveJournalEntry =');
const end = source.indexOf('  const pickImage =', start);
assert.ok(start !== -1 && end > start, 'Journal save controller must be present');
const controller = ts.transpileModule(source.slice(start, end), {
  compilerOptions: { target: ts.ScriptTarget.ES2020 },
}).outputText;
const bindSave = (environment) => new Function(
  ...Object.keys(environment), `${controller}\nreturn saveJournalEntry;`
)(...Object.values(environment));

function environment() {
  return {
    localDateKey: (date) => date.toISOString().split("T")[0],
    journalDirty: { current: true },
    journalDraft: { current: { content: 'First draft', photoUri: 'photo.jpg', audioUri: '' } },
    journalIdRef: { current: null },
    saveQueue: { current: Promise.resolve(true) },
    mounted: { current: true },
    setIsSaving() {},
    setCurrentJournalId() {},
    setSaveError() {},
    console: { error() {} },
    createJournalEntry: async () => {},
    updateJournalEntry: async () => {},
  };
}

test('overlapping saves create one entry and persist edits made during the first write', async () => {
  const env = environment();
  const created = [];
  const updates = [];
  let release;
  env.createJournalEntry = async (entry) => {
    created.push(entry);
    await new Promise((resolve) => { release = resolve; });
  };
  env.updateJournalEntry = async (id, draft) => { updates.push({ id, ...draft }); };
  const save = bindSave(env);
  const first = save();
  await Promise.resolve();
  env.journalDraft.current = { content: 'Latest edited text', photoUri: '', audioUri: '' };
  const second = save();
  const third = save();
  release();
  assert.deepEqual(await Promise.all([first, second, third]), [true, true, true]);
  assert.equal(created.length, 1);
  assert.equal(updates.length, 1);
  assert.equal(updates[0].id, created[0].id);
  assert.equal(updates[0].content, 'Latest edited text');
  assert.equal(updates[0].photoUri, '', 'removed attachment must be cleared in storage');
  assert.equal(env.journalDirty.current, false);
});

test('failed writes retain the draft, report failure, and can be retried', async () => {
  const env = environment();
  let fail = true;
  const errors = [];
  env.setSaveError = (message) => errors.push(message);
  env.createJournalEntry = async () => { if (fail) throw new Error('Storage unavailable'); };
  const save = bindSave(env);
  assert.equal(await save(), false);
  assert.equal(env.journalDirty.current, true);
  assert.equal(env.journalIdRef.current, null);
  assert.match(errors.at(-1), /could not be saved/);
  fail = false;
  assert.equal(await save(), true);
  assert.equal(env.journalDirty.current, false);
  assert.ok(env.journalIdRef.current);
  assert.equal(errors.at(-1), null);
});
