// Resolve: move heavy imports to function-local require statements based on detections
// Usage: tsx resolve.ts <file-path> <detections-json>

import fs from 'fs';
import ts from 'typescript';

type Detection = { path: string; description?: string; location?: string };

function computeIndentation(source: string, pos: number): string {
  let i = pos;
  while (i > 0 && source[i - 1] !== '\n' && source[i - 1] !== '\r') i--;
  let j = i;
  while (j < source.length && (source[j] === ' ' || source[j] === '\t')) j++;
  return source.slice(i, j);
}

function parseModuleFromDescription(desc: string | undefined): string | null {
  if (!desc) return null;
  const m = desc.match(/heavy module '([^']+)'/);
  return m ? m[1] : null;
}

function collectTopLevelImportForModule(sf: ts.SourceFile, moduleName: string) {
  let found: { node: ts.Node; namespaceName?: string; named?: Array<{ property: string; name: string }>; defaultName?: string } | null = null;
  sf.forEachChild((node) => {
    if (found) return;
    if (ts.isImportDeclaration(node) && node.importClause && ts.isStringLiteral(node.moduleSpecifier) && node.moduleSpecifier.text === moduleName) {
      const rec: any = { node };
      if (node.importClause.name) rec.defaultName = node.importClause.name.text;
      if (node.importClause.namedBindings) {
        if (ts.isNamespaceImport(node.importClause.namedBindings)) {
          rec.namespaceName = node.importClause.namedBindings.name.text;
        } else if (ts.isNamedImports(node.importClause.namedBindings)) {
          rec.named = node.importClause.namedBindings.elements.map((el) => ({
            property: el.propertyName ? el.propertyName.text : el.name.text,
            name: el.name.text,
          }));
        }
      }
      found = rec;
      return;
    }
    if (ts.isVariableStatement(node)) {
      for (const decl of node.declarationList.declarations) {
        const init = decl.initializer;
        if (!init || !ts.isCallExpression(init)) continue;
        if (!ts.isIdentifier(init.expression) || init.expression.text !== 'require') continue;
        if (init.arguments.length !== 1 || !ts.isStringLiteral(init.arguments[0])) continue;
        const mod = (init.arguments[0] as ts.StringLiteral).text;
        if (mod !== moduleName) continue;
        const rec: any = { node };
        if (ts.isIdentifier(decl.name)) {
          rec.namespaceName = (decl.name as ts.Identifier).text;
        } else if (ts.isObjectBindingPattern(decl.name)) {
          rec.named = decl.name.elements.map((el) => ({
            property: el.propertyName ? (el.propertyName as ts.Identifier).text : (el.name as ts.Identifier).text,
            name: (el.name as ts.Identifier).text,
          }));
        }
        found = rec;
      }
    }
  });
  return found;
}

function buildRequireStmt(binding: { namespaceName?: string; named?: Array<{ property: string; name: string }>; defaultName?: string }, moduleName: string): string | null {
  if (binding.namespaceName) return `const ${binding.namespaceName} = require('${moduleName}');`;
  if (binding.named && binding.named.length) {
    const inside = binding.named
      .map((b) => (b.property === b.name ? b.name : `${b.property}: ${b.name}`))
      .join(', ');
    return `const { ${inside} } = require('${moduleName}');`;
  }
  if (binding.defaultName) return null; // avoid ESM/CJS default ambiguity
  return null;
}

function processFile(filePath: string, detectionsJson: string) {
  const detections: Detection[] = (() => {
    try {
      const parsed = JSON.parse(detectionsJson);
      return Array.isArray(parsed) ? parsed : [parsed];
    } catch {
      return [];
    }
  })();

  if (!detections.length) return;

  const source = fs.readFileSync(filePath, 'utf8');
  const kind = filePath.endsWith('.tsx')
    ? ts.ScriptKind.TSX
    : filePath.endsWith('.ts')
    ? ts.ScriptKind.TS
    : filePath.endsWith('.jsx')
    ? ts.ScriptKind.JSX
    : ts.ScriptKind.JS;
  const sf = ts.createSourceFile(filePath, source, ts.ScriptTarget.ES2022, true, kind);

  let newSource = source;
  const resolutions: any[] = [];

  for (const det of detections) {
    const mod = parseModuleFromDescription(det.description) || '';
    if (!mod) continue;
    const found = collectTopLevelImportForModule(sf, mod);
    if (!found) continue;
    const requireStmt = buildRequireStmt(found, mod);
    if (!requireStmt) continue;

    const remNode = (found as any).node as ts.Node;
    // Edits: plan relative to original source, then apply in descending order
    const edits: Array<{ start: number; end: number; insert: string }> = [];

    // Removal of the top-level import/require statement
    let remStart = remNode.getFullStart();
    let remEnd = remNode.getEnd();
    while (remEnd < source.length && source[remEnd] !== '\n') remEnd++;
    if (remEnd < source.length) remEnd++;
    edits.push({ start: remStart, end: remEnd, insert: '' });

    // Insert at start of every function where module is used
    const names: string[] = [];
    if (found.namespaceName) names.push(found.namespaceName);
    if (found.named) names.push(...found.named.map((n) => n.name));

    const fnBodies: ts.Block[] = [];
    function nearestFunction(node: ts.Node): ts.FunctionLikeDeclarationBase | ts.MethodDeclaration | undefined {
      for (let p: ts.Node | undefined = node.parent; p; p = p.parent) {
        if (ts.isFunctionLike(p) || ts.isMethodDeclaration(p)) return p as any;
      }
      return undefined;
    }
    function isType(node: ts.Node): boolean {
      for (let p: ts.Node | undefined = node.parent; p; p = p.parent) {
        if (ts.isTypeNode(p)) return true;
        if (ts.isImportTypeNode && (ts as any).isImportTypeNode(p)) return true;
      }
      return false;
    }
    function visit(n: ts.Node) {
      if (ts.isIdentifier(n) && names.includes(n.text) && !isType(n)) {
        const fn = nearestFunction(n);
        if (fn && fn.body && ts.isBlock(fn.body)) fnBodies.push(fn.body);
      }
      ts.forEachChild(n, visit);
    }
    visit(sf);

    const uniqueBodies = Array.from(new Set(fnBodies));
    for (const b of uniqueBodies) {
      const afterBrace = b.getStart() + 1; // position of '{' + 1
      const atLineBreak = source[afterBrace] === '\n';
      const insertPos = atLineBreak ? afterBrace + 1 : afterBrace;
      const prefix = atLineBreak ? '' : '\n';
      const indent = computeIndentation(source, insertPos) + '  ';
      edits.push({ start: insertPos, end: insertPos, insert: `${prefix}${indent}${requireStmt}\n` });
    }

    // Apply edits on the original source descending by position
    edits.sort((a, b) => b.start - a.start);
    let text = source;
    for (const e of edits) {
      text = text.slice(0, e.start) + e.insert + text.slice(e.end);
    }
    newSource = text;

    resolutions.push({
      detection: { path: filePath, description: det.description || '' },
      success: true,
      description: `Moved '${mod}' import under function/method definitions where used (removed top-level import).`,
    });
  }

  if (newSource !== source) {
    fs.writeFileSync(filePath, newSource, 'utf8');
  }

  for (const r of resolutions) {
    process.stdout.write(JSON.stringify(r) + '\n');
  }
}

if (require.main === module) {
  const filePath = process.argv[2];
  const detectionsJson = process.argv[3] || '[]';
  if (!filePath) {
    console.error('Usage: tsx resolve.ts <file-path> <detections-json>');
    process.exit(1);
  }
  processFile(filePath, detectionsJson);
}
