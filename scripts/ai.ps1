param(
  [Parameter(Position=0)][string] $Task = "Remove Save on comments; unify post-detail reaction bar with feed; stop image flash after comment edit.",
  [int] $Rounds = 3,
  [switch] $AutoStash,
  [switch] $Stay
)
$ErrorActionPreference="Stop"

Write-Host "Checking working tree..."
$dirty = git status --porcelain
if ($dirty -and $AutoStash) {
  Write-Host "Auto-stashing..."
  git stash push -u -m ("auto-pre-ai-" + (Get-Date -Format "yyyyMMdd-HHmmss")) | Out-Null
  $dirty = $null; $restash = $true
}
if ($dirty) { Write-Error "Working tree not clean. Commit/stash or use -AutoStash."; $global:LASTEXITCODE = 2; if ($Stay){Read-Host "Press Enter to close"}; return }

if (-not (Get-Command npx -ErrorAction SilentlyContinue)) { Write-Error "npx not found"; $global:LASTEXITCODE = 1; if ($Stay){Read-Host "Press Enter to close"}; return }
if (-not (Get-Command tsx -ErrorAction SilentlyContinue)) { npm i -g tsx | Out-Null }

# Only DeepSeek required
if (-not $env:DEEPSEEK_API_KEY) { Write-Error "DEEPSEEK_API_KEY not set"; $global:LASTEXITCODE = 1; if ($Stay){Read-Host "Press Enter to close"}; return }
if (-not $env:DEEPSEEK_MODEL)   { $env:DEEPSEEK_MODEL = "deepseek-chat" }
$env:AI_MAX_ROUNDS = "$Rounds"

# Orchestrator absolute path
$orcPath = (Resolve-Path -Path ".\tools\ai-orchestrator.ts").Path

Write-Host "Running AI loop..."
Write-Host "Task: $Task"
try {
  npx tsx $orcPath $Task
  $code = $LASTEXITCODE
} catch {
  Write-Error $_.Exception.Message
  $code = 1
} finally {
  if ($restash) { Write-Host "Restoring stash..."; git stash pop | Out-Null }
}

$global:LASTEXITCODE = $code
switch ($code) {
  0 { Write-Host "Checks passed." }
  1 { Write-Host "Reviewer found no blocking issues but checks failed." }
  2 { Write-Host "Max rounds reached." }
  default { Write-Host "Orchestrator exited with code $code." }
}
if ($Stay) { Read-Host "Done. Press Enter to close" }
return
