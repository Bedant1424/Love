import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

const tables = [
  'categories',
  'products',
  'product_variants',
  'price_audit_logs',
  'system_settings',
  'inventory_audit_logs',
  'qr_versions',
  'payment_issues',
  'payment_submissions',
  'customers',
  'orders',
  'order_items',
  'order_status_history',
  'payment_status_history',
  'admin_users',
  'admin_sessions'
];

const backupDir = path.resolve('scratch');
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
}

const backupPath = path.join(backupDir, 'backup-live-db-1791774702592.json');
let backup = {
  timestamp: new Date().toISOString(),
  database: 'nagarjuna-traders-d1-test',
  tables: {}
};

if (fs.existsSync(backupPath)) {
  try {
    backup = JSON.parse(fs.readFileSync(backupPath, 'utf8'));
  } catch (e) {}
}

for (const table of tables) {
  if (backup.tables[table] && backup.tables[table].length > 0) {
    console.log(`Already backed up ${table} (${backup.tables[table].length} rows)`);
    continue;
  }
  try {
    console.log(`Exporting ${table}...`);
    const cmd = `npx wrangler d1 execute nagarjuna-traders-d1-test --remote --json --command="SELECT * FROM ${table}"`;
    const out = execSync(cmd, { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 });
    const parsed = JSON.parse(out);
    backup.tables[table] = parsed[0]?.results || [];
    console.log(`  -> ${table}: ${backup.tables[table].length} rows`);
  } catch (err) {
    console.error(`Error exporting ${table}:`, err.message);
  }
}

fs.writeFileSync(backupPath, JSON.stringify(backup, null, 2), 'utf8');
console.log(`\nSuccessfully updated complete backup to ${backupPath}`);
