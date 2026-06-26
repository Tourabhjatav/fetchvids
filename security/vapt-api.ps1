param(
  [string]$BaseUrl = "http://localhost:8787"
)

$ErrorActionPreference = "Stop"
$results = [System.Collections.Generic.List[object]]::new()

function Add-Result {
  param([string]$Test, [bool]$Passed, [string]$Evidence)
  $results.Add([pscustomobject]@{
    test = $Test
    passed = $Passed
    evidence = $Evidence
  })
}

function Invoke-TestRequest {
  param(
    [string]$Method,
    [string]$Path,
    [string]$Body,
    [string]$ContentType = "application/json"
  )
  try {
    $params = @{
      UseBasicParsing = $true
      Uri = "$BaseUrl$Path"
      Method = $Method
    }
    if ($Method -notin @("GET", "HEAD")) {
      $params.Body = $Body
      $params.ContentType = $ContentType
    }
    $response = Invoke-WebRequest @params
    return [pscustomobject]@{ Status = [int]$response.StatusCode; Body = $response.Content; Headers = $response.Headers }
  } catch {
    $response = $_.Exception.Response
    $reader = if ($response) { [System.IO.StreamReader]::new($response.GetResponseStream()) } else { $null }
    $bodyText = if ($reader) { $reader.ReadToEnd() } else { $_.Exception.Message }
    if ($reader) { $reader.Dispose() }
    return [pscustomobject]@{
      Status = if ($response) { [int]$response.StatusCode } else { 0 }
      Body = $bodyText
      Headers = if ($response) { $response.Headers } else { @{} }
    }
  }
}

$health = Invoke-TestRequest -Method GET -Path "/api/health"
Add-Result "Health endpoint" ($health.Status -eq 200 -and $health.Body -match '"ok":true') "HTTP $($health.Status)"

$requiredHeaders = @(
  "Content-Security-Policy",
  "X-Content-Type-Options",
  "X-Frame-Options",
  "Referrer-Policy",
  "Permissions-Policy"
)
foreach ($header in $requiredHeaders) {
  Add-Result "Security header: $header" ([bool]$health.Headers[$header]) ([string]$health.Headers[$header])
}

$badDomain = Invoke-TestRequest -Method POST -Path "/api/resolve" -Body '{"url":"https://example.com/video/1"}'
Add-Result "Reject untrusted domain" ($badDomain.Status -eq 400) "HTTP $($badDomain.Status)"

$userinfo = Invoke-TestRequest -Method POST -Path "/api/resolve" -Body '{"url":"https://instagram.com@127.0.0.1/reel/test/"}'
Add-Result "Reject URL userinfo/SSRF form" ($userinfo.Status -eq 400) "HTTP $($userinfo.Status)"

$shell = Invoke-TestRequest -Method POST -Path "/api/resolve" -Body '{"url":"https://www.youtube.com/watch?v=test%3Bwhoami"}'
Add-Result "Command-injection-shaped input is not executed" ($shell.Status -in @(400, 502) -and $shell.Body -notmatch "administrator|computer") "HTTP $($shell.Status)"

$wrongType = Invoke-TestRequest -Method POST -Path "/api/resolve" -Body '{"url":"https://youtu.be/test123"}' -ContentType "text/plain"
Add-Result "Reject non-JSON content type" ($wrongType.Status -eq 415) "HTTP $($wrongType.Status)"

$malformed = Invoke-TestRequest -Method POST -Path "/api/resolve" -Body '{"url":'
Add-Result "Reject malformed JSON safely" ($malformed.Status -eq 400 -and $malformed.Body -notmatch "SyntaxError|stack") "HTTP $($malformed.Status)"

$oversizedBody = '{"url":"' + ('a' * 3000) + '"}'
$oversized = Invoke-TestRequest -Method POST -Path "/api/resolve" -Body $oversizedBody
Add-Result "Reject oversized request body" ($oversized.Status -eq 413) "HTTP $($oversized.Status)"

$unknownApi = Invoke-TestRequest -Method GET -Path "/api/does-not-exist"
Add-Result "Unknown API returns 404" ($unknownApi.Status -eq 404) "HTTP $($unknownApi.Status)"

$rateLimited = $false
for ($i = 0; $i -lt 15; $i += 1) {
  $rateResponse = Invoke-TestRequest -Method POST -Path "/api/resolve" -Body '{"url":"https://example.com/video/1"}'
  if ($rateResponse.Status -eq 429) {
    $rateLimited = $true
    break
  }
}
Add-Result "Resolver rate limiting" $rateLimited "429 observed: $rateLimited"

$passed = ($results | Where-Object { -not $_.passed }).Count -eq 0
$report = [pscustomobject]@{
  target = $BaseUrl
  generatedAt = (Get-Date).ToString("o")
  passed = $passed
  results = $results
}

$report | ConvertTo-Json -Depth 5
if (-not $passed) { exit 1 }
