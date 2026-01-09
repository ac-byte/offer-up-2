# Windows Command Line Practices

## System Context
This workspace is running on Windows with cmd.exe shell. ALL commands must use Windows-specific syntax.

## Command Chaining Rules

### CORRECT Windows Syntax:
- **Sequential execution**: Use `&` to chain commands
  ```
  command1 & command2 & command3
  ```
- **Conditional execution**: Use `&&` for "run if previous succeeded"
  ```
  command1 && command2
  ```
- **Directory navigation**: Use `pushd` and `popd` instead of `cd`
  ```
  pushd subdirectory & npm install & popd
  ```

### FORBIDDEN Linux/Unix Syntax:
- ❌ **Never use semicolons**: `command1 ; command2` (Linux syntax)
- ❌ **Never use forward slashes**: `/path/to/file` (use `\path\to\file`)
- ❌ **Never use `cd` with &&**: `cd dir && command` (use `pushd dir & command & popd`)

## Directory Operations

### CORRECT:
```cmd
pushd server & npm install & popd
pushd client & npm start & popd
dir /s *.txt
```

### FORBIDDEN:
```bash
cd server && npm install && cd ..
cd client; npm start; cd ..
ls -la
find . -name "*.txt"
```

## Path Separators
- **Windows**: Use backslashes `\` or let Windows handle forward slashes in most contexts
- **Never assume**: Unix-style paths with forward slashes work everywhere

## File Operations
- **List files**: `dir` (not `ls`)
- **Copy files**: `copy` or `xcopy` (not `cp`)
- **Remove files**: `del` (not `rm`)
- **Remove directories**: `rmdir /s /q` (not `rm -rf`)

## Environment Variables
- **Windows**: `%VARIABLE%` or `$env:VARIABLE` in PowerShell
- **Never use**: `$VARIABLE` (Unix syntax)

## Port Management
When starting the client and server, **ALWAYS** explicitly set the PORT environment variable to ensure consistent port assignment regardless of startup order:

### Server (Port 3000):
```cmd
pushd server & set PORT=3000 & npm start & popd
```

### Client (Port 3001):
```cmd
set PORT=3001 & npm start
```

This prevents port conflicts and ensures:
- Server always runs on port 3000
- Client always runs on port 3001
- Consistent behavior regardless of which starts first

## Critical Reminders
1. **Always use `&` for command chaining**, never `;`
2. **Use `pushd/popd` for directory changes**, never `cd` with chaining
3. **Explicitly set PORT environment variables** when starting client/server
4. **Test commands work on Windows cmd.exe**, not bash/zsh
5. **Remember the system context**: Windows 10, cmd shell, win32 platform

This ensures all commands execute properly on the Windows environment.