# Git Commit Practices

## Commit Message Requirements

When performing git commits, you MUST always use a temporary file for the commit message instead of inline `-m` flag.

### Required Process:

1. **Create temporary commit message file**:
   ```
   fsWrite("temp_commit_message.txt", "Your commit message content")
   ```

2. **Stage changes**:
   ```
   git add [files]
   ```

3. **Commit using temporary file**:
   ```
   git commit -F temp_commit_message.txt
   ```

4. **Push changes**:
   ```
   git push
   ```

5. **Clean up temporary file**:
   ```
   deleteFile("temp_commit_message.txt")
   ```

### Benefits:
- Consistent with .gitignore patterns
- Allows for multi-line commit messages without shell escaping issues
- Provides better commit message formatting
- Avoids command line parsing problems with special characters

### Forbidden:
- Never use `git commit -m "message"` directly
- Never commit without using a temporary file

This ensures consistent, well-formatted commit messages and avoids shell command line issues.