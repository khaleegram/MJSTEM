param(
  [switch]$PersistClearUserEnv,
  [switch]$NoTurbopack
)

$proxyVars = @(
  "HTTP_PROXY",
  "HTTPS_PROXY",
  "ALL_PROXY",
  "GIT_HTTP_PROXY",
  "GIT_HTTPS_PROXY"
)

foreach ($name in $proxyVars) {
  Remove-Item -Path "Env:$name" -ErrorAction SilentlyContinue
}

if ($PersistClearUserEnv) {
  foreach ($name in $proxyVars) {
    [Environment]::SetEnvironmentVariable($name, $null, "User")
  }
  Write-Host "Cleared proxy variables from User environment."
}

$cachePaths = @(
  ".next",
  "node_modules/.cache"
)

foreach ($path in $cachePaths) {
  if (Test-Path -LiteralPath $path) {
    Remove-Item -LiteralPath $path -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host "Removed cache path: $path"
  }
}

if ($NoTurbopack) {
  Write-Host "Cleared proxy variables and cache. Starting Next.js dev server (webpack mode)..."
  npx next dev -p 9002
} else {
  Write-Host "Cleared proxy variables and cache. Starting Next.js dev server (turbopack mode)..."
  npm run dev
}
