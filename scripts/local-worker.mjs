import {readdir, readFile} from 'node:fs/promises';
import {createTestHarness, unstable_splitSqlQuery} from 'wrangler';

export const adminPassword = 'synthetic-local-admin-password';
export const staffPassword = 'synthetic-local-staff-password';

export async function startLocalWorker() {
 const config = JSON.parse(await readFile('wrangler.jsonc', 'utf8'));
 const worker = createTestHarness({
  workers: [{config: {
   name: 'nova-test',
   main: config.main,
   compatibility_date: config.compatibility_date,
   assets: config.assets,
   vars: {ADMIN_PASSWORD: adminPassword, ADMIN_SIGNING_KEY: 'synthetic-local-signing-key'},
   d1_databases: [{binding: 'DB', database_id: '00000000-0000-4000-8000-000000000001'}],
   r2_buckets: [{binding: 'MEDIA', bucket_name: 'nova-test-media'}]
  }}]
 });
 try {
  const {url} = await worker.listen();
  const base = url.origin;
  const {DB: db} = await worker.getWorker().getEnv();
  const dir = new URL('../migrations/', import.meta.url);
  for (const file of (await readdir(dir)).filter(name => name.endsWith('.sql')).sort()) {
   const sql = await readFile(new URL(file, dir), 'utf8');
   const statements = unstable_splitSqlQuery(sql);
   await db.batch(statements.map(s => db.prepare(s)));
  }
  return {worker, db, base: base};
 } catch (error) {
  await worker.close();
  throw error;
 }
}
