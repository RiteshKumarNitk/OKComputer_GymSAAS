import { execSync } from 'child_process';
import fs from 'fs';

try {
  // Use shell redirect to capture stderr correctly on all exits
  const output = execSync('node --env-file=.env server/seed-admin.js 2> server/error.txt', { stdio: 'pipe' });
  fs.writeFileSync('server/output.txt', output.toString());
  console.log('Success');
} catch (e) {
  fs.writeFileSync('server/output.txt', e.stdout ? e.stdout.toString() : 'No Stdout');
  console.log('Error logged');
}
