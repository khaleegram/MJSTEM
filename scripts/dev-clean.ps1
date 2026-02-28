param(
  [switch]$PersistClearUserEnv
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

Write-Host "Cleared proxy variables for current process. Starting Next.js dev server..."
npm run dev
