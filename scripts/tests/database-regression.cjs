// Run from the repository root: node scripts/tests/database-regression.cjs
// Requires Node with node:sqlite (Node 22.13+). Uses real in-memory SQLite,
// adapting Expo's asynchronous interface without needing a device.
const fs = require('fs');
const vm = require('vm');
const ts = require(process.cwd() + '/node_modules/typescript');
const {DatabaseSync} = require('node:sqlite');
const assert = require('node:assert/strict');
const source = fs.readFileSync('utils/database.ts','utf8');
const compiled = ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;
function load(existing, fail = false, clock = Date) {
 const sqlite = new DatabaseSync(':memory:');
 if(existing) sqlite.exec(existing);
 let opens = 0;
 const adapter = {
 execAsync: async sql => sqlite.exec(sql),
 getFirstAsync: async (sql,args=[]) => sqlite.prepare(sql).get(...args) ?? null,
 getAllAsync: async (sql,args=[]) => sqlite.prepare(sql).all(...args),
 runAsync: async (sql,args=[]) => sqlite.prepare(sql).run(...args),
 withTransactionAsync: async fn => {sqlite.exec('BEGIN');try{await fn();sqlite.exec('COMMIT')}catch(e){sqlite.exec('ROLLBACK');throw e}},
 closeAsync: async()=>{}
 };
 const dates={};
 vm.runInNewContext(ts.transpileModule(fs.readFileSync('utils/dates.ts','utf8'), {compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText, {exports:dates,Date:clock});
 const exports={};
 vm.runInNewContext(compiled,{exports,console,Date:clock,require:name=>name==='expo-sqlite'?{openDatabaseAsync:async()=>{opens++;if(fail){fail=false;throw Error('storage failure')}return adapter}}:name==='./dates'?dates:name==='./affirmations'?{DEFAULT_AFFIRMATIONS:['a','b','c','d','e']}:require(name)});
 return {api:exports,sqlite,opens:()=>opens};
}
(async()=>{
 const fresh=load();
 await assert.rejects(fresh.api.createHabit({id:'bad',title:'bad',color:'red'}), /unavailable/);
 await Promise.all([fresh.api.initDatabase(),fresh.api.initDatabase()]);
 assert.equal(fresh.opens(),1);
 assert.equal((await fresh.api.getAllHabits()).length,3);
 assert.equal((await fresh.api.getAllAffirmations()).length,5);
 for(const h of await fresh.api.getAllHabits()) await fresh.api.deleteHabit(h.id);
 await fresh.api.initDatabase();
 assert.equal((await fresh.api.getAllHabits()).length,0);
 await fresh.api.createJournalEntry({id:'j',content:'saved',date:'2026-09-24'});
 assert.equal((await fresh.api.getJournalEntryById('j')).content,'saved');
 await fresh.api.clearAllData();
 await fresh.api.updateProfile({isPremium:true});
 assert.equal((await fresh.api.getProfile()).isPremium,1);
 const schema = fresh.sqlite.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name IN ('habits','affirmations')").all().map(r=>r.sql).join(';');
 const existing=load(schema);
 await existing.api.initDatabase();
 assert.equal((await existing.api.getAllHabits()).length,0);
 assert.equal((await existing.api.getAllAffirmations()).length,0);
 const failed=load(null,true);
 await assert.rejects(failed.api.initDatabase(),/storage failure/);
 assert.equal(failed.api.isDatabaseReady(),false);
 await assert.rejects(failed.api.createJournalEntry({id:'lost',content:'x',date:'x'}),/unavailable/);
 assert.equal(await failed.api.retryDatabaseInit(),true);
 // Exercise local-day boundaries and DST using the actual database function.
 for (const timezone of ['America/Los_Angeles', 'Pacific/Auckland']) {
   process.env.TZ = timezone;
   const instant = timezone === 'America/Los_Angeles' ? '2026-03-10T02:00:00Z' : '2026-03-08T12:00:00Z';
   const RealDate = Date;
   class Clock extends RealDate { constructor(...args) { super(...(args.length ? args : [instant])); } }
   const stats=load(null,false,Clock);
   await stats.api.initDatabase();
   async function check(dates, current, longest) {
     stats.sqlite.exec('DELETE FROM habit_completions');
     for(const date of dates) await stats.api.setHabitCompletion('starter_habit_0',date,true);
     const actual=await stats.api.getStreakData();
     assert.equal(actual.currentStreak,current, `${timezone} current: ${dates}`);
     assert.equal(actual.longestStreak,longest, `${timezone} longest: ${dates}`);
     assert.equal(actual.totalCompletions,dates.length);
   }
   // Both instants are March 9 locally, but March 10/8 respectively in UTC.
   await check([],0,0);
   await check(['2026-03-09','2026-03-08','2026-03-07'],3,3);
   await check(['2026-03-08','2026-03-07'],2,2);
   await check(['2026-03-07','2026-03-06'],0,2);
   await check(['2026-03-09','2026-03-07','2026-03-06','2026-03-05'],1,3);
 }
 console.log('PASS: first-install seed, existing empty data preservation, concurrency, real writes, reset/profile, init rejection/retry, consecutive streaks, gaps, local dates and DST.');
})().catch(e=>{console.error(e);process.exitCode=1});
