param(
  [string]$OutFile = "$PSScriptRoot\smtc_query.exe"
)

$ErrorActionPreference = 'Stop'

$candidates = @(
  "${env:ProgramFiles(x86)}\Microsoft Visual Studio\2022\BuildTools\MSBuild\Current\Bin\Roslyn\csc.exe",
  "${env:ProgramFiles(x86)}\Microsoft Visual Studio\2019\BuildTools\MSBuild\Current\Bin\Roslyn\csc.exe",
  "$env:WINDIR\Microsoft.NET\Framework64\v4.0.30319\csc.exe"
)
$csc = $candidates | Where-Object { Test-Path $_ } | Select-Object -First 1
if (-not $csc) {
  throw 'csc.exe not found. Install Visual Studio Build Tools or .NET Framework build tools.'
}

$unionRoot = "${env:ProgramFiles(x86)}\Windows Kits\10\UnionMetadata"
$winmd = Get-ChildItem -Path $unionRoot -Recurse -Filter Windows.winmd -ErrorAction SilentlyContinue |
  Where-Object { $_.FullName -match '\\10\.0\.\d+\.\d+\\Windows\.winmd$' } |
  Sort-Object FullName -Descending |
  Select-Object -First 1
if (-not $winmd) {
  throw 'Windows.winmd not found. Install the Windows 10/11 SDK.'
}

$systemRuntime = "$env:WINDIR\Microsoft.NET\Framework64\v4.0.30319\System.Runtime.dll"
if (-not (Test-Path $systemRuntime)) {
  throw "System.Runtime.dll not found at $systemRuntime"
}

$source = Join-Path $PSScriptRoot 'smtc_query.cs'
& $csc /nologo /platform:x64 /out:$OutFile "/reference:$($winmd.FullName)" "/reference:$systemRuntime" /reference:System.Runtime.WindowsRuntime.dll $source
if ($LASTEXITCODE -ne 0) {
  throw "csc failed with exit code $LASTEXITCODE"
}

Write-Output "Built $OutFile"
