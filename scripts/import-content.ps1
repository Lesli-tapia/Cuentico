param([switch]$Verify)

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.IO.Compression.FileSystem
$taskRoot = Split-Path -Parent $PSScriptRoot
$taskUtf8 = New-Object System.Text.UTF8Encoding($false)

function Read-DocxParagraphs([string]$Path) {
    $taskArchive = [IO.Compression.ZipFile]::OpenRead($Path)
    try {
        $taskEntry = $taskArchive.GetEntry('word/document.xml')
        if (-not $taskEntry) { throw "Missing word/document.xml: $Path" }
        $taskReader = New-Object IO.StreamReader($taskEntry.Open(), [Text.Encoding]::UTF8)
        try { [xml]$taskDocument = $taskReader.ReadToEnd() } finally { $taskReader.Dispose() }
        $taskNamespace = New-Object Xml.XmlNamespaceManager($taskDocument.NameTable)
        $taskNamespace.AddNamespace('w', 'http://schemas.openxmlformats.org/wordprocessingml/2006/main')
        foreach ($taskParagraph in $taskDocument.SelectNodes('//w:body/w:p', $taskNamespace)) {
            $taskText = ($taskParagraph.SelectNodes('.//w:t', $taskNamespace) | ForEach-Object { $_.InnerText }) -join ''
            # Keep every original non-empty paragraph, including its whitespace.
            if ($taskText.Length -gt 0) { Write-Output $taskText }
        }
    } finally { $taskArchive.Dispose() }
}

$taskDefinitions = @(
    @{ id='alas'; folder='1 Las alas que brillaban con el sol'; doc='CUENTO 1.docx'; ends=@(2,5,6,12,14,19); theme='Fantasía y autoestima'; character='Elian'; portrait=5; duration=8; activity='FAVORITE_MOMENT'; activityTitle='Nuestro momento favorito'; activityScenes=@(1,3,5,6) },
    @{ id='nilo'; folder='2 Milo el gato explorador'; doc='CUENTO 2.docx'; ends=@(2,5,9,14,17,22); theme='Animales y amistad'; character='Nilo'; portrait=1; duration=8; activity='SEQUENCE'; activityTitle='Ordena la aventura'; activityScenes=@(1,3,5,6) },
    @{ id='kiro'; folder='3 Kiro y el corazón de la sabana'; doc='CUENTO 3.docx'; ends=@(3,8,13,16,19,24); theme='Naturaleza y trabajo en equipo'; character='Kiro'; portrait=1; duration=8; activity='GUESS_CHARACTER'; activityTitle='Adivina el personaje'; activityScenes=@(1,2,5,6) },
    @{ id='tortas'; folder='4 El misterio de las tortas desaparecidas'; doc='CUENTO 4.docx'; ends=@(2,4,8,13,23,27); theme='Aventuras y generosidad'; character='Martina'; portrait=2; duration=8; activity='SEQUENCE'; activityTitle='Ordena la aventura'; activityScenes=@(1,3,5,6) }
)

$taskStories = @()
for ($taskOrder = 0; $taskOrder -lt $taskDefinitions.Count; $taskOrder++) {
    $taskDefinition = $taskDefinitions[$taskOrder]
    $taskFolder = Join-Path $taskRoot ('Referencias\Cuentos\' + $taskDefinition.folder)
    $taskParagraphs = @(Read-DocxParagraphs (Join-Path $taskFolder $taskDefinition.doc))
    $taskScenes = @()
    $taskStart = 1
    for ($taskSceneNumber=1; $taskSceneNumber -le 6; $taskSceneNumber++) {
        $taskEnd = $taskDefinition.ends[$taskSceneNumber-1]
        $taskSceneId = $taskDefinition.id + '-' + $taskSceneNumber
        $taskImagePath = '/assets/stories/' + $taskDefinition.id + '/' + $taskSceneNumber + '.png'
        $taskOriginalImage = Join-Path $taskFolder ($taskSceneNumber.ToString() + '.png')
        if ($taskDefinition.id -eq 'nilo' -and $taskSceneNumber -ge 5) {
            $taskCandidates = @(Get-ChildItem -LiteralPath $taskFolder -Filter ('*-' + $taskSceneNumber + '.png'))
            if ($taskCandidates.Count -ne 1) { throw "Expected exactly one Nilo image $taskSceneNumber" }
            $taskOriginalImage = $taskCandidates[0].FullName
        }
        if (-not (Test-Path -LiteralPath $taskOriginalImage)) { throw "Missing original image: $taskOriginalImage" }
        $taskDestination = Join-Path $taskRoot ('public' + $taskImagePath.Replace('/', '\'))
        if (-not $Verify) {
            New-Item -ItemType Directory -Path (Split-Path -Parent $taskDestination) -Force | Out-Null
            Copy-Item -LiteralPath $taskOriginalImage -Destination $taskDestination -Force
        } elseif (-not (Test-Path -LiteralPath $taskDestination)) { throw "Missing imported image: $taskDestination" }
        if ((Get-FileHash -LiteralPath $taskOriginalImage).Hash -ne (Get-FileHash -LiteralPath $taskDestination).Hash) { throw "Image differs from original: $taskDestination" }
        $taskScenes += [ordered]@{
            id=$taskSceneId; index=($taskSceneNumber-1); image=$taskImagePath
            paragraphs=@($taskParagraphs[$taskStart..$taskEnd])
            events=@([ordered]@{sceneId=$taskSceneId; eventType='IMAGE_ANIMATION'; trigger='ON_SCENE_ENTER'; delayMs=0; asset=$null; durationMs=700; enabled=$true})
        }
        $taskStart = $taskEnd+1
    }
    $taskReassembled = @($taskScenes | ForEach-Object { $_.paragraphs })
    $taskOriginal = @($taskParagraphs[1..($taskParagraphs.Count-1)])
    if ($taskReassembled.Count -ne $taskOriginal.Count) { throw "Paragraph count differs for $($taskDefinition.id)" }
    for ($taskIndex=0; $taskIndex -lt $taskOriginal.Count; $taskIndex++) {
        if (-not [string]::Equals($taskOriginal[$taskIndex], $taskReassembled[$taskIndex], [StringComparison]::Ordinal)) { throw "Paragraph differs: $($taskDefinition.id), $taskIndex" }
    }
    $taskStories += [ordered]@{
        id=$taskDefinition.id; title=$taskParagraphs[0]; description=$taskParagraphs[1]; order=($taskOrder+1)
        ageMin=6; ageMax=7; durationMinutes=$taskDefinition.duration; theme=$taskDefinition.theme
        cover=('/assets/stories/' + $taskDefinition.id + '/1.png'); available=$true; scenes=$taskScenes
        character=[ordered]@{id=($taskDefinition.id + '-character'); name=$taskDefinition.character; image=('/assets/stories/' + $taskDefinition.id + '/' + $taskDefinition.portrait + '.png')}
        activity=[ordered]@{id=($taskDefinition.id + '-activity'); type=$taskDefinition.activity; title=$taskDefinition.activityTitle; sceneIds=@($taskDefinition.activityScenes | ForEach-Object {$taskDefinition.id + '-' + $_})}
    }
    Write-Output ("Verified " + $taskDefinition.id + ': ' + $taskOriginal.Count + ' original paragraphs, 6 images.')
}
$taskStories += [ordered]@{id='proximamente'; title='Próximamente'; description=''; order=5; ageMin=6; ageMax=7; durationMinutes=0; theme=''; cover=''; available=$false; scenes=@(); character=$null; activity=$null}
$taskCatalog = [ordered]@{universe=[ordered]@{id='universo-cuentico'; title='Un universo de historias'}; library=[ordered]@{id='primera-biblioteca'; title='Pequeñas grandes aventuras'; access='Free'}; stories=$taskStories}

$taskTipParagraphs = @(Read-DocxParagraphs (Join-Path $taskRoot 'Referencias\TIPS PARA LOS PADRES.docx'))
$taskTips = [ordered]@{before=@(); during=@()}
$taskStage = $null
foreach ($taskParagraph in $taskTipParagraphs) {
    if ($taskParagraph -eq 'ANTES DE LEER') { $taskStage='before'; continue }
    if ($taskParagraph -eq 'DURANTE LA LECTURA') { $taskStage='during'; continue }
    if ($taskStage) { $taskTips[$taskStage] += $taskParagraph }
}
if ($taskTips.before.Count -ne 18 -or $taskTips.during.Count -ne 13) { throw 'Unexpected tip count; review the source document.' }

if (-not $Verify) {
    New-Item -ItemType Directory -Path (Join-Path $taskRoot 'content') -Force | Out-Null
    [IO.File]::WriteAllText((Join-Path $taskRoot 'content\catalog.json'), ($taskCatalog | ConvertTo-Json -Depth 20), $taskUtf8)
    [IO.File]::WriteAllText((Join-Path $taskRoot 'content\tips.json'), ($taskTips | ConvertTo-Json -Depth 5), $taskUtf8)
    $taskAssets = Join-Path $taskRoot 'public\assets'
    New-Item -ItemType Directory -Path (Join-Path $taskAssets 'fonts') -Force | Out-Null
    Copy-Item -LiteralPath (Join-Path $taskRoot 'Branding\logo.svg') -Destination (Join-Path $taskAssets 'logo.svg') -Force
    foreach ($taskFont in @('Poppins-Regular.ttf','Poppins-Medium.ttf','Poppins-SemiBold.ttf','Poppins-Bold.ttf','OFL.txt')) {
        Copy-Item -LiteralPath (Join-Path $taskRoot ('Branding\poppins\' + $taskFont)) -Destination (Join-Path $taskAssets ('fonts\' + $taskFont)) -Force
    }
} else {
    $taskSavedCatalog = Get-Content -LiteralPath (Join-Path $taskRoot 'content\catalog.json') -Raw -Encoding UTF8 | ConvertFrom-Json
    foreach ($taskStory in $taskCatalog.stories | Where-Object { $_.available }) {
        $taskSavedStory = $taskSavedCatalog.stories | Where-Object { $_.id -eq $taskStory.id }
        if (-not $taskSavedStory -or $taskSavedStory.title -cne $taskStory.title) { throw "Catalog title differs: $($taskStory.id)" }
        $taskSavedParagraphs = @($taskSavedStory.scenes | ForEach-Object { $_.paragraphs })
        $taskExpectedParagraphs = @($taskStory.scenes | ForEach-Object { $_.paragraphs })
        if ($taskSavedParagraphs.Count -ne $taskExpectedParagraphs.Count) { throw "Saved paragraph count differs: $($taskStory.id)" }
        for ($taskIndex=0; $taskIndex -lt $taskExpectedParagraphs.Count; $taskIndex++) {
            if (-not [string]::Equals($taskSavedParagraphs[$taskIndex], $taskExpectedParagraphs[$taskIndex], [StringComparison]::Ordinal)) { throw "Saved text differs: $($taskStory.id), $taskIndex" }
        }
    }
    $taskSavedTips = Get-Content -LiteralPath (Join-Path $taskRoot 'content\tips.json') -Raw -Encoding UTF8 | ConvertFrom-Json
    foreach ($taskStage in @('before','during')) {
        if ($taskSavedTips.$taskStage.Count -ne $taskTips[$taskStage].Count) { throw "Saved tip count differs: $taskStage" }
        for ($taskIndex=0; $taskIndex -lt $taskTips[$taskStage].Count; $taskIndex++) {
            if (-not [string]::Equals($taskSavedTips.$taskStage[$taskIndex], $taskTips[$taskStage][$taskIndex], [StringComparison]::Ordinal)) { throw "Saved tip differs: $taskStage, $taskIndex" }
        }
    }
}
Write-Output 'Content verified: 92 original story paragraphs, 31 parent tips, 24 original images. Fifth slot unavailable.'
