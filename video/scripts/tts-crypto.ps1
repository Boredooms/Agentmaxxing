Add-Type -AssemblyName System.Speech
$root = Join-Path $PSScriptRoot "..\public\audio\crypto"
New-Item -ItemType Directory -Force -Path $root | Out-Null

$scenes = @(
  @{ file = "crypto-01.wav"; text = "VANTA has a wallet. Testnet U S D C on Base Sepolia, and a human approval before every paid call." },
  @{ file = "crypto-02.wav"; text = "The wallet is real. An address on Base Sepolia, testnet E T H for gas, and eighteen point eight seven U S D C for work. No mainnet path." },
  @{ file = "crypto-03.wav"; text = "Ask for the weather in Mumbai. VANTA selects get weather, and stops. The approval names the exact call, the price, and the network. Nothing runs until you decide." },
  @{ file = "crypto-04.wav"; text = "You approve. The server consumes a single-use approval, verifies the x four oh two payment, and settles on chain. The trace records the transaction." },
  @{ file = "crypto-05.wav"; text = "The wallet moves from eighteen point eight seven to eighteen point eight six U S D C. A real Base Sepolia transaction, with a receipt you can open." },
  @{ file = "crypto-06.wav"; text = "VANTA. Give it a job. Keep the receipts. Testnet only. Human approval. Real receipts." }
)

$synth = New-Object System.Speech.Synthesis.SpeechSynthesizer
$voice = $synth.GetInstalledVoices() | Where-Object { $_.VoiceInfo.Name -eq "Microsoft Zira Desktop" } | Select-Object -First 1
if ($voice) { $synth.SelectVoice($voice.VoiceInfo.Name) }
$synth.Rate = 2
$synth.Volume = 100

foreach ($scene in $scenes) {
  $path = Join-Path $root $scene.file
  $synth.SetOutputToWaveFile($path)
  $synth.Speak($scene.text)
  $synth.SetOutputToNull()
  Write-Output "$($scene.file) $((Get-Item $path).Length) bytes"
}

$synth.Dispose()
