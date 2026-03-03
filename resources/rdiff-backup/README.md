# rdiff-backup binaries for workspace checkpointing

Place rdiff-backup executables here for each platform. Checkpointing will be disabled if binaries are missing.

## Directory layout

```
resources/rdiff-backup/
  win32-x64/
    rdiff-backup.exe
  darwin-x64/
    rdiff-backup
  darwin-arm64/
    rdiff-backup
  linux-x64/
    rdiff-backup
  linux-arm64/
    rdiff-backup
```

## Download sources

- **Windows**: https://github.com/rdiff-backup/rdiff-backup/releases — download `rdiff-backup-2.2.6.win32-x64exe.zip` (or latest 2.2.x), extract `rdiff-backup.exe` into `win32-x64/`
- **macOS**: Build from source or use pyinstaller output. See https://rdiff-backup.net/ and https://github.com/rdiff-backup/rdiff-backup
- **Linux**: Use system package (`apt install rdiff-backup`, etc.) or build from source

## Version

Use rdiff-backup 2.2.x or later (new CLI with `backup`, `restore`, `remove increments` actions).
