$ErrorActionPreference = "Stop"

$port = 4173
$hostName = "127.0.0.1"

Write-Host "Starting Garage Maintenance Manager..."
Write-Host "Open http://localhost:$port/ in your browser."

if (Get-Command py -ErrorAction SilentlyContinue) {
  py -m http.server $port --bind $hostName
  exit
}

if (Get-Command python -ErrorAction SilentlyContinue) {
  python -m http.server $port --bind $hostName
  exit
}

Write-Error "Python was not found. Install Python or open index.html directly in your browser."
