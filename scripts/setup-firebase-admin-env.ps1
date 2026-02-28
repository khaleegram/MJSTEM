param(
  [Parameter(Mandatory = $false)]
  [string]$ServiceAccountJsonPath = "secrets/mjstem-admin.json",

  [Parameter(Mandatory = $false)]
  [string]$EnvPath = ".env.local",

  [Parameter(Mandatory = $false)]
  [string]$ClientEnvFallbackPath = ".env",

  [Parameter(Mandatory = $false)]
  [switch]$NoInlineCredentials
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

if (-not (Test-Path -LiteralPath $ServiceAccountJsonPath)) {
  throw "Service account JSON not found: $ServiceAccountJsonPath"
}

$resolvedJsonPath = (Resolve-Path -LiteralPath $ServiceAccountJsonPath).Path
$serviceAccount = Get-Content -LiteralPath $resolvedJsonPath -Raw | ConvertFrom-Json

$projectId = [string]$serviceAccount.project_id
$clientEmail = [string]$serviceAccount.client_email
$privateKey = [string]$serviceAccount.private_key

if ([string]::IsNullOrWhiteSpace($projectId)) {
  throw "Missing 'project_id' in $resolvedJsonPath"
}
if (-not $NoInlineCredentials -and [string]::IsNullOrWhiteSpace($clientEmail)) {
  throw "Missing 'client_email' in $resolvedJsonPath"
}
if (-not $NoInlineCredentials -and [string]::IsNullOrWhiteSpace($privateKey)) {
  throw "Missing 'private_key' in $resolvedJsonPath"
}

if (-not (Test-Path -LiteralPath $EnvPath)) {
  New-Item -ItemType File -Path $EnvPath -Force | Out-Null
}

$existingLines = Get-Content -LiteralPath $EnvPath -ErrorAction SilentlyContinue
$lineList = New-Object "System.Collections.Generic.List[string]"
if ($null -ne $existingLines) {
  foreach ($line in $existingLines) {
    [void]$lineList.Add($line)
  }
}

function Parse-EnvFile {
  param([string]$Path)

  $map = @{}
  if (-not (Test-Path -LiteralPath $Path)) {
    return $map
  }

  Get-Content -LiteralPath $Path | ForEach-Object {
    if ($_ -match '^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=(.*)$') {
      $key = $matches[1]
      $value = $matches[2].Trim()
      if ($value.StartsWith('"') -and $value.EndsWith('"') -and $value.Length -ge 2) {
        $value = $value.Substring(1, $value.Length - 2)
      }
      $map[$key] = $value
    }
  }

  return $map
}

function Set-EnvValue {
  param(
    [System.Collections.Generic.List[string]]$Lines,
    [string]$Key,
    [string]$Value
  )

  $pattern = "^\s*$([regex]::Escape($Key))\s*="
  $replacement = "$Key=$Value"

  for ($i = 0; $i -lt $Lines.Count; $i++) {
    if ($Lines[$i] -match $pattern) {
      $Lines[$i] = $replacement
      return
    }
  }

  [void]$Lines.Add($replacement)
}

function Set-EnvValueIfMissing {
  param(
    [System.Collections.Generic.List[string]]$Lines,
    [string]$Key,
    [string]$Value
  )

  if ([string]::IsNullOrWhiteSpace($Value)) {
    return
  }

  $pattern = "^\s*$([regex]::Escape($Key))\s*=(.*)$"
  for ($i = 0; $i -lt $Lines.Count; $i++) {
    if ($Lines[$i] -match $pattern) {
      $existingValue = $matches[1].Trim()
      if ([string]::IsNullOrWhiteSpace($existingValue)) {
        $Lines[$i] = "$Key=$Value"
      }
      return
    }
  }

  [void]$Lines.Add("$Key=$Value")
}

$jsonPathForEnv = $resolvedJsonPath -replace "\\", "/"
Set-EnvValue -Lines $lineList -Key "NEXT_PUBLIC_FIREBASE_PROJECT_ID" -Value $projectId
Set-EnvValue -Lines $lineList -Key "FIREBASE_PROJECT_ID" -Value $projectId
Set-EnvValue -Lines $lineList -Key "GOOGLE_APPLICATION_CREDENTIALS" -Value $jsonPathForEnv

if (-not $NoInlineCredentials) {
  $escapedPrivateKey = $privateKey -replace "(`r`n|`n|`r)", "\n"
  Set-EnvValue -Lines $lineList -Key "GOOGLE_SERVICE_ACCOUNT_EMAIL" -Value $clientEmail
  Set-EnvValue -Lines $lineList -Key "GOOGLE_PRIVATE_KEY" -Value ('"' + $escapedPrivateKey + '"')
}

# Keep client-side Firebase config available in .env.local.
# If these are blank/missing, Next.js client SDK initialization can fail even when admin env is set.
$clientFallback = Parse-EnvFile -Path $ClientEnvFallbackPath
$clientKeys = @(
  "NEXT_PUBLIC_FIREBASE_API_KEY",
  "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
  "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
  "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET",
  "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
  "NEXT_PUBLIC_FIREBASE_APP_ID",
  "NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID"
)
foreach ($key in $clientKeys) {
  Set-EnvValueIfMissing -Lines $lineList -Key $key -Value ([string]$clientFallback[$key])
}

Set-Content -LiteralPath $EnvPath -Value $lineList -Encoding UTF8

Write-Host "Updated $EnvPath using $resolvedJsonPath" -ForegroundColor Green
Write-Host "Set: NEXT_PUBLIC_FIREBASE_PROJECT_ID, FIREBASE_PROJECT_ID, GOOGLE_APPLICATION_CREDENTIALS" -ForegroundColor Cyan
if (-not $NoInlineCredentials) {
  Write-Host "Set: GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_PRIVATE_KEY" -ForegroundColor Cyan
}
if (Test-Path -LiteralPath $ClientEnvFallbackPath) {
  Write-Host "Filled missing NEXT_PUBLIC_FIREBASE_* values from $ClientEnvFallbackPath" -ForegroundColor Cyan
}
