import { describe, expect, test } from 'bun:test'
import {
  type AsExpression,
  Node,
  type ParameterDeclaration,
  Project,
  SyntaxKind,
  type Type,
} from 'ts-morph'

const DOMAIN_SOURCE_PATTERNS = [
  'packages/*/domain/entities/**/*.ts',
  'packages/*/domain/value-objects/**/*.ts',
]

const PRODUCTION_SOURCE_PATTERNS = [
  'packages/*/application/**/*.ts',
  'packages/*/domain/repositories/**/*.ts',
  'packages/*/domain/entities/**/*.ts',
  'packages/*/domain/value-objects/**/*.ts',
  'packages/*/infrastructure/**/*.ts',
]

const PARAMETER_RULE_PATTERNS = [
  'packages/*/application/**/*.service.ts',
  'packages/*/domain/repositories/**/*.ts',
]

const ALLOWED_PRIMITIVE_PARAMETER_NAMES = new Set([
  'password',
  'currentPassword',
  'newPassword',
])

function createProject(): Project {
  const project = new Project({
    skipAddingFilesFromTsConfig: true,
    tsConfigFilePath: 'tsconfig.json',
  })

  project.addSourceFilesAtPaths([
    ...DOMAIN_SOURCE_PATTERNS,
    ...PRODUCTION_SOURCE_PATTERNS,
  ])

  return project
}

function getDomainModelNames(project: Project): Set<string> {
  const names = new Set<string>()

  for (const file of project.getSourceFiles(DOMAIN_SOURCE_PATTERNS)) {
    for (const classDeclaration of file.getClasses()) {
      const name = classDeclaration.getName()
      if (name) names.add(name)
    }
  }

  return names
}

function isPrimitiveType(type: Type): boolean {
  if (
    type.isString() ||
    type.isNumber() ||
    type.isBoolean() ||
    type.isBigInt()
  ) {
    return true
  }

  if (!type.isUnion()) return false

  return type
    .getUnionTypes()
    .filter((unionType) => !unionType.isNull() && !unionType.isUndefined())
    .every(isPrimitiveType)
}

function hasPrimitiveTypeNode(parameter: ParameterDeclaration): boolean {
  const typeNode = parameter.getTypeNode()
  if (!typeNode) return false

  if (
    [
      SyntaxKind.StringKeyword,
      SyntaxKind.NumberKeyword,
      SyntaxKind.BooleanKeyword,
      SyntaxKind.BigIntKeyword,
      SyntaxKind.SymbolKeyword,
    ].includes(typeNode.getKind())
  ) {
    return true
  }

  return isPrimitiveType(parameter.getType())
}

function getLocation(node: Node): string {
  const filePath = node.getSourceFile().getFilePath()
  const relativePath = filePath.replace(`${process.cwd()}/`, '')
  const { line, column } = node
    .getSourceFile()
    .getLineAndColumnAtPos(node.getStart())

  return `${relativePath}:${line}:${column}`
}

function getCastTargetName(expression: AsExpression): string | null {
  const typeNode = expression.getTypeNode()

  if (Node.isTypeReference(typeNode)) return typeNode.getTypeName().getText()
  if (Node.isExpressionWithTypeArguments(typeNode)) {
    return typeNode.getExpression().getText()
  }

  return null
}

describe('The domain architecture', () => {
  test('does not cast primitives into domain entities or value objects', () => {
    const project = createProject()
    const domainModelNames = getDomainModelNames(project)
    const violations: string[] = []

    for (const file of project.getSourceFiles(PRODUCTION_SOURCE_PATTERNS)) {
      for (const cast of file.getDescendantsOfKind(SyntaxKind.AsExpression)) {
        const targetName = getCastTargetName(cast)
        if (!targetName || !domainModelNames.has(targetName)) continue

        const sourceType = cast.getExpression().getType()
        if (!isPrimitiveType(sourceType)) continue

        violations.push(
          `${getLocation(cast)} casts primitive ${sourceType.getText()} to ${targetName}`,
        )
      }
    }

    expect(violations).toEqual([])
  })

  test('keeps primitives out of application services and repository ports', () => {
    const project = createProject()
    const violations: string[] = []

    for (const file of project.getSourceFiles(PARAMETER_RULE_PATTERNS)) {
      for (const parameter of file.getDescendantsOfKind(SyntaxKind.Parameter)) {
        const parameterName = parameter.getName()
        if (ALLOWED_PRIMITIVE_PARAMETER_NAMES.has(parameterName)) continue
        if (!hasPrimitiveTypeNode(parameter)) continue

        violations.push(
          `${getLocation(parameter)} uses primitive parameter ${parameterName}: ${parameter.getType().getText()}`,
        )
      }
    }

    expect(violations).toEqual([])
  })
})
