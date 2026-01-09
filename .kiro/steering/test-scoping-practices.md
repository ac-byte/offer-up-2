# Test Scoping Practices (TEMPORARY)

## Critical Issue
The test suite in this repository generates ~1.7M of log output when run without constraints, causing context overflow. This is a temporary steering document until the underlying test issue is resolved.

## MANDATORY Test Scoping Rules

### NEVER Run Broad Tests:
- ❌ `npm test` (runs all tests, causes overflow)
- ❌ `npm run test` (same issue)
- ❌ `jest` without specific patterns
- ❌ Any test command that could run the full suite

### ALWAYS Scope Tests Narrowly:

#### Single Test File:
```cmd
npm test -- GameBoard.test.tsx
npm test -- steal-a-point-effects.test.ts
```

#### Specific Test Pattern:
```cmd
npm test -- --testNamePattern="steal a point"
npm test -- --testPathPattern="components"
```

#### Single Test Suite:
```cmd
npm test -- --testNamePattern="GameBoard Interactive Messages"
```

#### Limit Output:
```cmd
npm test -- --verbose=false --silent GameBoard.test.tsx
```

## Examples of Safe Test Commands:

### Testing Specific Components:
```cmd
npm test -- src/components/GameBoard.test.tsx
npm test -- src/__tests__/game-logic/steal-a-point-effects.test.ts
```

### Testing Specific Functionality:
```cmd
npm test -- --testNamePattern="steal.*point"
npm test -- --testPathPattern="steal-a-point"
```

## Emergency Override
If you absolutely must run broader tests, use:
```cmd
npm test -- --maxWorkers=1 --verbose=false --silent [specific-pattern]
```

## Reminder
This is a **TEMPORARY** measure. The underlying test logging issue needs to be addressed separately. Until then, ALWAYS scope tests narrowly to prevent context overflow and maintain productivity.

## Priority
Bug fixes take priority over test suite fixes. Focus on functionality first, then address the test logging issue later.