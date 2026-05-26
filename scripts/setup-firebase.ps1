param(
  [Parameter(Mandatory = $true)]
  [string]$ProjectId,

  [string]$DisplayName = "DM2 Auto Gestao",
  [string]$Location = "southamerica-east1"
)

$ErrorActionPreference = "Stop"

$workspace = Split-Path -Parent $PSScriptRoot
$env:CLOUDSDK_CONFIG = Join-Path $workspace ".gcloud"

Write-Host "Usando projeto: $ProjectId"
Write-Host "Configuracao gcloud: $env:CLOUDSDK_CONFIG"

gcloud.cmd projects create $ProjectId --name="$DisplayName"
gcloud.cmd config set project $ProjectId

gcloud.cmd services enable `
  firebase.googleapis.com `
  firestore.googleapis.com `
  identitytoolkit.googleapis.com `
  cloudresourcemanager.googleapis.com

npx.cmd firebase-tools projects:addfirebase $ProjectId --non-interactive

try {
  gcloud.cmd firestore databases create --location=$Location
} catch {
  Write-Host "Firestore ja pode existir. Continuando..."
}

npx.cmd firebase-tools apps:create WEB "$DisplayName Web" --project $ProjectId --non-interactive
npx.cmd firebase-tools deploy --only firestore:rules,firestore:indexes --project $ProjectId

Write-Host ""
Write-Host "Proximo passo:"
Write-Host "1. Rode: npx firebase-tools apps:list --project $ProjectId"
Write-Host "2. Copie o App ID web."
Write-Host "3. Rode: npx firebase-tools apps:sdkconfig WEB APP_ID --project $ProjectId"
Write-Host "4. Preencha o .env.local com as chaves retornadas."
Write-Host ""
Write-Host "No console Firebase, ative os provedores Auth: E-mail/senha, Google e Microsoft."
