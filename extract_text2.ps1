[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$bytes = [System.IO.File]::ReadAllBytes('D:\AB\docx_temp\word\document.xml')
$content = [System.Text.Encoding]::UTF8.GetString($bytes)
$text = $content -replace '<[^>]+>', ' '
$text = $text -replace '\s+', ' '
$text | Out-File -FilePath 'D:\AB\document_text.txt' -Encoding UTF8
Write-Output "Done"
