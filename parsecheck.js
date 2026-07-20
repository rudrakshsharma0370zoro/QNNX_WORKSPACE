const ts = require('typescript');
const fs = require('fs');
const files = [
  'src/lib/s3.ts',
  'src/app/api/documents/[id]/route.ts',
  'src/app/dashboard/admin/documents/page.tsx',
  'src/app/dashboard/lead/documents/page.tsx',
  'src/app/dashboard/user/documents/page.tsx',
  'src/app/dashboard/admin/projects/page.tsx',
  'src/app/dashboard/lead/projects/page.tsx',
  'src/app/dashboard/lead/layout.tsx',
  'src/app/dashboard/admin/tasks/page.tsx',
];
let hadError = false;
for (const f of files) {
  const src = fs.readFileSync(f, 'utf8');
  const sf = ts.createSourceFile(f, src, ts.ScriptTarget.Latest, true, f.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  const diags = sf.parseDiagnostics || [];
  if (diags.length) {
    hadError = true;
    console.log('=== ' + f + ' ===');
    for (const d of diags) {
      const msg = ts.flattenDiagnosticMessageText(d.messageText, '\n');
      const pos = sf.getLineAndCharacterOfPosition(d.start);
      console.log(`  Line ${pos.line+1}, Col ${pos.character+1}: ${msg}`);
    }
  } else {
    console.log('OK: ' + f);
  }
}
process.exit(hadError ? 1 : 0);
