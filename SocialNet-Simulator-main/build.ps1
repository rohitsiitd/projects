# Detect OS
if ($IsWindows) {
    $compiler = "g++"
    $output = "program.exe"
    $runCmd = ".\program.exe"
} else {
    $compiler = "g++"
    $output = "program"
    $runCmd = "./program"
}

$flags = "-std=c++17"  
$sources = (Get-ChildItem -Filter *.cpp | ForEach-Object { $_.Name }) -join " "

Write-Host "Compiling project..."
Invoke-Expression "$compiler $flags $sources -o $output"

if ($LASTEXITCODE -eq 0) {
    Write-Host "Compilation successful! Running program..."
    Invoke-Expression $runCmd
} else {
    Write-Host "Compilation failed!"
}
