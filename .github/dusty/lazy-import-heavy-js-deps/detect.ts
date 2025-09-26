// Detect top-level heavy imports in TS/JS files (no edits)
// Usage: tsx detect.ts <file-path>

import fs from 'fs';
import ts from 'typescript';
import heavyModulesJs from './heavy-modules-js';

type ImportKind = 'es-import' | 'cjs-require';
type ImportBinding = {
  kind: ImportKind;
  module: string;
  defaultName?: string;
  namespaceName?: string;
  namedBindings?: Array<{ property: string; name: string }>;
  cjsVarName?: string;
  cjsDestructure?: Array<{ property: string; name: string }>;
  node: ts.Node;
};

function getHeavyModules(): string[] {
  const env = process.env.HEAVY_MODULES_JS;
  if (env) return env.split(',').map((m) => m.trim());
  return heavyModulesJs;
}

function isHeavyModule(mod: string, heavy: string[]): boolean {
  const name = mod.toLowerCase();
  return heavy.some((hm) => {
    const h = hm.toLowerCase();
    if (h.endsWith('*')) return name.startsWith(h.slice(0, -1));
    return name === h;
  });
}

function collectTopLevelImports(sf: ts.SourceFile, heavy: string[]): ImportBinding[] {
  const out: ImportBinding[] = [];
  sf.forEachChild((node) => {
    if (ts.isImportDeclaration(node) && node.importClause && ts.isStringLiteral(node.moduleSpecifier)) {
      const mod = node.moduleSpecifier.text;
      if (!isHeavyModule(mod, heavy)) return;
      if (node.importClause.isTypeOnly) return;
      const binding: ImportBinding = { kind: 'es-import', module: mod, node };
      if (node.importClause.name) binding.defaultName = node.importClause.name.text;
      if (node.importClause.namedBindings) {
        if (ts.isNamespaceImport(node.importClause.namedBindings)) {
          binding.namespaceName = node.importClause.namedBindings.name.text;
        } else if (ts.isNamedImports(node.importClause.namedBindings)) {
          binding.namedBindings = node.importClause.namedBindings.elements.map((el) => ({
            property: el.propertyName ? el.propertyName.text : el.name.text,
            name: el.name.text,
          }));
        }
      }
      if (!binding.defaultName && !binding.namespaceName && !binding.namedBindings?.length) return;
      out.push(binding);
      return;
    }
    if (ts.isVariableStatement(node)) {
      for (const decl of node.declarationList.declarations) {
        const init = decl.initializer;
        if (!init || !ts.isCallExpression(init)) continue;
        if (!ts.isIdentifier(init.expression) || init.expression.text !== 'require') continue;
        if (init.arguments.length !== 1 || !ts.isStringLiteral(init.arguments[0])) continue;
        const mod = (init.arguments[0] as ts.StringLiteral).text;
        if (!isHeavyModule(mod, heavy)) continue;
        const binding: ImportBinding = { kind: 'cjs-require', module: mod, node };
        if (ts.isIdentifier(decl.name)) {
          binding.cjsVarName = decl.name.text;
        } else if (ts.isObjectBindingPattern(decl.name)) {
          binding.cjsDestructure = decl.name.elements.map((el) => ({
            property: el.propertyName ? (el.propertyName as ts.Identifier).text : (el.name as ts.Identifier).text,
            name: (el.name as ts.Identifier).text,
          }));
        } else continue;
        out.push(binding);
      }
    }
  });
  return out;
}

function isInTypePosition(node: ts.Node): boolean {
  for (let p: ts.Node | undefined = node.parent; p; p = p.parent) {
    if (ts.isTypeNode(p)) return true;
    if (ts.isImportTypeNode && (ts as any).isImportTypeNode(p)) return true;
    if (ts.isTypeAliasDeclaration(p) || ts.isInterfaceDeclaration(p)) return true;
  }
  return false;
}

function isImportBindingIdentifier(node: ts.Identifier): boolean {
  for (let p: ts.Node | undefined = node.parent; p; p = p.parent) {
    if (
      ts.isImportDeclaration(p) ||
      ts.isImportClause(p) ||
      ts.isNamespaceImport(p) ||
      ts.isNamedImports(p) ||
      ts.isImportSpecifier(p)
    )
      return true;
    if (ts.isSourceFile(p)) break;
  }
  return false;
}

function isRequireBindingIdentifier(node: ts.Identifier): boolean {
  const parent = node.parent;
  if (ts.isVariableDeclaration(parent) && parent.name === node) return true;
  if (ts.isBindingElement(parent) && parent.name === node) return true;
  return false;
}

function collectDeclaredNames(binding: ImportBinding): string[] {
  const names: string[] = [];
  if (binding.kind === 'cjs-require') {
    if (binding.cjsVarName) names.push(binding.cjsVarName);
    if (binding.cjsDestructure) names.push(...binding.cjsDestructure.map((b) => b.name));
    return names;
  }
  if (binding.defaultName) names.push(binding.defaultName);
  if (binding.namespaceName) names.push(binding.namespaceName);
  if (binding.namedBindings) names.push(...binding.namedBindings.map((b) => b.name));
  return names;
}

function findUsages(sf: ts.SourceFile, names: string[]) {
  const usages: { topLevel?: true; fn?: ts.FunctionLikeDeclarationBase | ts.MethodDeclaration }[] = [];
  function nearestFunction(node: ts.Node): ts.FunctionLikeDeclarationBase | ts.MethodDeclaration | undefined {
    for (let p: ts.Node | undefined = node.parent; p; p = p.parent) {
      if (ts.isFunctionLike(p) || ts.isMethodDeclaration(p)) return p as any;
    }
    return undefined;
  }
  function visit(node: ts.Node) {
    if (ts.isIdentifier(node) && names.includes(node.text)) {
      if (isImportBindingIdentifier(node) || isRequireBindingIdentifier(node) || isInTypePosition(node)) {
        // skip
      } else {
        const fn = nearestFunction(node);
        if (!fn) usages.push({ topLevel: true });
        else usages.push({ fn });
      }
    }
    ts.forEachChild(node, visit);
  }
  visit(sf);
  return usages;
}

function processFile(filePath: string) {
  const heavy = getHeavyModules();
  const source = fs.readFileSync(filePath, 'utf8');
  const kind = filePath.endsWith('.tsx')
    ? ts.ScriptKind.TSX
    : filePath.endsWith('.ts')
    ? ts.ScriptKind.TS
    : filePath.endsWith('.jsx')
    ? ts.ScriptKind.JSX
    : ts.ScriptKind.JS;
  const sf = ts.createSourceFile(filePath, source, ts.ScriptTarget.ES2022, true, kind);
  const imports = collectTopLevelImports(sf, heavy);
  for (const imp of imports) {
    const names = collectDeclaredNames(imp);
    if (names.length === 0) continue;
    const usages = findUsages(sf, names);
    const topLevel = usages.some((u) => u.topLevel);
    const inFns = usages.filter((u) => !!u.fn).length > 0;
    if (!topLevel && inFns) {
      const loc = sf.getLineAndCharacterOfPosition(imp.node.getStart()).line + 1;
      const detection = {
        path: filePath,
        description: `Top-level import of heavy module '${imp.module}' used only inside function/method scopes: consider lazy require inside those scopes`,
        location: `import line ${loc}`,
      };
      process.stdout.write(JSON.stringify(detection) + '\n');
    }
  }
}

if (require.main === module) {
  const filePath = process.argv[2];
  if (!filePath) {
    console.error('Usage: tsx detect.ts <file-path>');
    process.exit(1);
  }
  processFile(filePath);
}

