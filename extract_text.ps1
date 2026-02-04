$content = Get-Content 'D:\AB\docx_temp\word\document.xml' -Raw -Encoding UTF8
$text = $content -replace '<[^>]+>', ' '
$text = $text -replace '\s+', ' '
Write-Output $text
