[CmdletBinding()]
param(
    [switch]$DryRun
)

$ErrorActionPreference = 'Stop'

$repoRoot = (git rev-parse --show-toplevel).Trim()
Set-Location $repoRoot

if (git status --porcelain) {
    throw 'Commit or stash your changes before syncing with upstream.'
}

if ((git branch --show-current).Trim() -ne 'customization') {
    git switch customization
}

git fetch upstream master
if ($LASTEXITCODE -ne 0) {
    throw 'Could not fetch upstream/master.'
}

if ($DryRun) {
    git log --oneline 'master..upstream/master'
    exit 0
}

# Replay only local changes on the newest upstream code.
git rebase --onto upstream/master master customization
if ($LASTEXITCODE -ne 0) {
    throw 'Rebase stopped for a conflict. Resolve it, then run git rebase --continue.'
}

git branch -f master upstream/master
git branch --set-upstream-to=upstream/master master
Write-Host 'Upstream sync complete. You are on customization.'
