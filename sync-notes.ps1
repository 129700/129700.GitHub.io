# sync-notes.ps1 - Sync Obsidian vault to Hugo blog inbox
param(
    [string]$ConfigFile = ".\sync-config.json"
)

# Load config
$cfg = Get-Content $ConfigFile -Raw -Encoding UTF8 | ConvertFrom-Json
$Source = $cfg.source
$DiaryFolder = $cfg.diary_folder
$MomentsHeading = $cfg.moments_heading
$Target = ".\_inbox"
$MomentsFile = ".\data\moments.yaml"
$PictureDir = Join-Path $Source "Picture"

# Excluded folders
$exclude = @(".obsidian", "Picture", ".git", ".trash", $DiaryFolder)

if (-not (Test-Path $Source)) {
    Write-Host "[ERROR] $Source not found" -ForegroundColor Red
    exit 1
}

# ===== Step 1: Sync MD notes to _inbox =====
if (-not (Test-Path $Target)) {
    New-Item -Path $Target -ItemType Directory -Force | Out-Null
}
Remove-Item "$Target\*" -Recurse -Force -ErrorAction SilentlyContinue
Write-Host "[INBOX] Cleaned" -ForegroundColor Gray

$noteCount = 0
$imgCount = 0

function Copy-Images {
    param([string]$Src, [string]$DestDir, [string]$Content)
    $newContent = $Content

    # Pattern 1: ![alt](D:\Robomaster\...\Picture\xxx.png) -> ![alt](xxx.png)
    $absPattern = '!\[([^\]]*)\]\(([A-Z]:[^\)]*?Picture[\\/]([^\\/\)]+))\)'
    $matches = [regex]::Matches($newContent, $absPattern)
    foreach ($m in $matches) {
        $fullPath = $m.Groups[2].Value
        $fileName = $m.Groups[3].Value
        if (Test-Path $fullPath) {
            Copy-Item $fullPath -Destination (Join-Path $DestDir $fileName) -Force
            $script:imgCount++
            Write-Host "  [IMG] $fileName" -ForegroundColor DarkCyan
        }
        $newContent = $newContent.Replace($m.Groups[2].Value, $fileName)
    }

    # Pattern 2: Obsidian ![[Picture/xxx.png]] -> ![xxx](xxx.png)
    $wikiPattern = '!\[\[(Picture[\\/]([^\]|]+)(?:\|[^\]]*)?)\]\]'
    $wmatches = [regex]::Matches($newContent, $wikiPattern)
    foreach ($wm in $wmatches) {
        $imgPath = Join-Path $Source $wm.Groups[1].Value
        $fileName = $wm.Groups[2].Value -replace '.*[\\/]',''
        if (Test-Path $imgPath) {
            Copy-Item $imgPath -Destination (Join-Path $DestDir $fileName) -Force
            $script:imgCount++
            Write-Host "  [IMG] $fileName (wiki)" -ForegroundColor DarkCyan
        }
        $newContent = $newContent.Replace($wm.Value, "![$fileName]($fileName)")
    }

    # Pattern 3: ![alt](../Picture/xxx.png) relative from vault
    $relPattern = '!\[([^\]]*)\]\(([^\)]*?Picture[\\/]([^\\/\)]+))\)'
    $rmatches = [regex]::Matches($newContent, $relPattern)
    foreach ($rm in $rmatches) {
        $relPath = $rm.Groups[2].Value -replace '/','\'
        # Resolve relative to the source file's parent directory
        $imgFull = Join-Path (Split-Path $Src -Parent) $relPath
        $imgFull = [System.IO.Path]::GetFullPath($imgFull)
        $fileName = $rm.Groups[3].Value

        # Also try from the vault Picture dir
        $fromPicture = Join-Path $PictureDir $fileName
        if (Test-Path $imgFull) {
            Copy-Item $imgFull -Destination (Join-Path $DestDir $fileName) -Force
            $script:imgCount++
            Write-Host "  [IMG] $fileName (rel)" -ForegroundColor DarkCyan
        } elseif (Test-Path $fromPicture) {
            Copy-Item $fromPicture -Destination (Join-Path $DestDir $fileName) -Force
            $script:imgCount++
            Write-Host "  [IMG] $fileName (Picture)" -ForegroundColor DarkCyan
        }
        $newContent = $newContent.Replace($rm.Groups[2].Value, $fileName)
    }

    return $newContent
}

Get-ChildItem -Path $Source -Filter "*.md" -Recurse | ForEach-Object {
    $skip = $false
    foreach ($pat in $exclude) {
        if ($_.FullName -match "\\$pat\\" -or $_.FullName -match "\\$pat$") {
            $skip = $true; break
        }
    }
    if (-not $skip) {
        $rel = $_.FullName.Substring($Source.Length).TrimStart("\")
        $dest = Join-Path $Target $rel
        $destDir = Split-Path $dest -Parent
        if (-not (Test-Path $destDir)) {
            New-Item -Path $destDir -ItemType Directory -Force | Out-Null
        }

        $content = Get-Content $_.FullName -Encoding UTF8 -Raw
        $newContent = Copy-Images -Src $_.FullName -DestDir $destDir -Content $content
        [System.IO.File]::WriteAllText($dest, $newContent, [System.Text.UTF8Encoding]::new($false))
        $noteCount++
        Write-Host "  [NOTE] $rel" -ForegroundColor Green
    }
}

# ===== Step 2: Extract moments from diary =====
$diaryPath = Join-Path $Source $DiaryFolder
$moments = @()

if (Test-Path $diaryPath) {
    Write-Host ""
    Write-Host "[MOMENTS] Scanning $DiaryFolder..." -ForegroundColor Magenta

    Get-ChildItem -Path $diaryPath -Filter "*.md" `
    | Sort-Object Name -Descending `
    | ForEach-Object {

        $dateMatch = [regex]::Match($_.BaseName, '^(\d{4}-\d{2}-\d{2})')
        if (-not $dateMatch.Success) { return }
        $day = $dateMatch.Groups[1].Value

        $lines = Get-Content $_.FullName -Encoding UTF8
        $inBlock = $false

        foreach ($line in $lines) {
            $t = $line.Trim()

            if ($t -eq $MomentsHeading) {
                $inBlock = $true
                continue
            }

            if ($inBlock) {
                if ($t.StartsWith("## ") -or $t.StartsWith("# ")) { break }

                $txt = $t.TrimStart('-').Trim()
                if ($txt -ne "") {
                    $moments += @{ date = $day; text = $txt }
                }
            }
        }

        if ($inBlock) {
            Write-Host "  [M] $($_.BaseName)" -ForegroundColor Green
        }
    }
}

# ===== Step 3: Write moments.yaml =====
$yaml = "# Generated by sync-notes.ps1`n"
$yaml += "# Diary: $Source/$DiaryFolder`n"
foreach ($m in $moments) {
    $yaml += "- date: `"$($m.date)`"`n  text: `"$($m.text)`"`n"
}
if ($moments.Count -eq 0) {
    $yaml += "`n"
}

$momentsPath = (Resolve-Path $MomentsFile).Path
[System.IO.File]::WriteAllText($momentsPath, $yaml, [System.Text.UTF8Encoding]::new($false))

# ===== Done =====
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host " Notes : $noteCount" -ForegroundColor Green
Write-Host " Images: $imgCount" -ForegroundColor DarkCyan
Write-Host " Moments: $($moments.Count)" -ForegroundColor Magenta
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Next: tell me to publish." -ForegroundColor Yellow
