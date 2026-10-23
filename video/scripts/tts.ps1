Add-Type -AssemblyName System.Speech
$root = Join-Path $PSScriptRoot "..\public\audio"
New-Item -ItemType Directory -Force -Path $root | Out-Null

$scenes = @(
  @{ file = "scene-01.wav"; text = "Most agents ask for your trust. VANTA shows you the work." },
  @{ file = "scene-02.wav"; text = "Give it a mission. Before the model sees a toolbox, VANTA classifies the request and writes a plan. Each step changes state only when it actually happens." },
  @{ file = "scene-03.wav"; text = "Real tools run. You see the arguments, the payload, and the measured duration. Thirteen free tools, no wallet required." },
  @{ file = "scene-04.wav"; text = "When a tool costs money, the loop stops. The exact call, price, and network. A single-use approval. Deny it, and the paid tool never runs." },
  @{ file = "scene-05.wav"; text = "The answer carries receipts. Real source URLs, and a testnet settlement when you approve." },
  @{ file = "scene-06.wav"; text = "VANTA. Give it a job. Keep the receipts." }
)

$synth = New-Object System.Speech.Synthesis.SpeechSynthesizer
$voice = $synth.GetInstalledVoices() | Where-Object { $_.VoiceInfo.Name -eq "Microsoft Zira Desktop" } | Select-Object -First 1
if ($voice) { $synth.SelectVoice($voice.VoiceInfo.Name) }
$synth.Rate = -1
$synth.Volume = 100

foreach ($scene in $scenes) {
  $path = Join-Path $root $scene.file
  $synth.SetOutputToWaveFile($path)
  $synth.Speak($scene.text)
  $synth.SetOutputToNull()
  Write-Output "$($scene.file) $((Get-Item $path).Length) bytes"
}

$synth.Dispose()
