$runtimeUrl = $args[0]
$overrideUrl = $args[1]
$current = [string] (Get-Location -PSProvider FileSystem)
$client = New-Object System.Net.WebClient

function downloadWithRetry {
	param([string]$url, [string]$dest, [int]$retry) 
	Write-Host
	Write-Host "Attempt: $retry"
    Write-Host
    trap {
    	Write-Host $_.Exception.ToString()
	    if ($retry -lt 5) {
	    	$retry=$retry+1
	    	Write-Host
	    	Write-Host "Waiting 5 seconds and retrying"
	    	Write-Host
	    	Start-Sleep -s 5
	    	downloadWithRetry $url $dest $retry $client
	    }
	    else {
	    	Write-Host "Download failed"
	   		throw "Max number of retries downloading [5] exceeded" 	
	    }
    }
    $client.downloadfile($url, $dest)
}

function download($url, $dest) {
	Write-Host "Downloading $url"
	downloadWithRetry $url $dest 1
}

function copyOnVerify($file, $output) {
  Write-Host "Verifying $file"
  $verify = Get-AuthenticodeSignature $file
  Out-Host -InputObject $verify
  if ($verify.Status -ne "Valid") {
     throw "Invalid signature for runtime package $file"
  }
  else {
    mv $file $output
  }
}

if ($overrideUrl) {
    Write-Host "Using override url: $overrideUrl"
	$url = $overrideUrl
}
else {
	$url = $runtimeUrl
}

foreach($singleUrl in $url -split ";") 
{
    $suffix = Get-Random
    $downloaddir = $current + "\sandbox" + $suffix
    mkdir $downloaddir
    $dest = $downloaddir + "\sandbox.exe"
    download $singleUrl $dest
    $final = $downloaddir + "\runtime.exe"
    copyOnVerify $dest $final
    if (Test-Path -LiteralPath $final)
    {
      cd $downloaddir
      if ($host.Version.Major -eq 3)
      {
        .\runtime.exe -y | Out-Null
        .\setup.cmd
      }
      else
      {
        Start-Process -FilePath $final -ArgumentList -y -Wait 
        $cmd = $downloaddir + "\setup.cmd"
        Start-Process -FilePath $cmd -Wait
      }
    }
    else
    {
       throw "Unable to verify package"
    }
    cd $current
    if (Test-Path -LiteralPath $downloaddir)
    {
       Remove-Item -LiteralPath $downloaddir -Force -Recurse
    }
}

# SIG # Begin signature block
# MIIkDgYJKoZIhvcNAQcCoIIj/zCCI/sCAQExDzANBglghkgBZQMEAgEFADB5Bgor
# BgEEAYI3AgEEoGswaTA0BgorBgEEAYI3AgEeMCYCAwEAAAQQH8w7YFlLCE63JNLG
# KX7zUQIBAAIBAAIBAAIBAAIBADAxMA0GCWCGSAFlAwQCAQUABCDXy9ooJXpxQ2zB
# jJwhYrAU4qvfbnub7C2bNxfnQMHQvKCCDYMwggYBMIID6aADAgECAhMzAAAAxOmJ
# +HqBUOn/AAAAAADEMA0GCSqGSIb3DQEBCwUAMH4xCzAJBgNVBAYTAlVTMRMwEQYD
# VQQIEwpXYXNoaW5ndG9uMRAwDgYDVQQHEwdSZWRtb25kMR4wHAYDVQQKExVNaWNy
# b3NvZnQgQ29ycG9yYXRpb24xKDAmBgNVBAMTH01pY3Jvc29mdCBDb2RlIFNpZ25p
# bmcgUENBIDIwMTEwHhcNMTcwODExMjAyMDI0WhcNMTgwODExMjAyMDI0WjB0MQsw
# CQYDVQQGEwJVUzETMBEGA1UECBMKV2FzaGluZ3RvbjEQMA4GA1UEBxMHUmVkbW9u
# ZDEeMBwGA1UEChMVTWljcm9zb2Z0IENvcnBvcmF0aW9uMR4wHAYDVQQDExVNaWNy
# b3NvZnQgQ29ycG9yYXRpb24wggEiMA0GCSqGSIb3DQEBAQUAA4IBDwAwggEKAoIB
# AQCIirgkwwePmoB5FfwmYPxyiCz69KOXiJZGt6PLX4kvOjMuHpF4+nypH4IBtXrL
# GrwDykbrxZn3+wQd8oUK/yJuofJnPcUnGOUoH/UElEFj7OO6FYztE5o13jhwVG87
# 7K1FCTBJwb6PMJkMy3bJ93OVFnfRi7uUxwiFIO0eqDXxccLgdABLitLckevWeP6N
# +q1giD29uR+uYpe/xYSxkK7WryvTVPs12s1xkuYe/+xxa8t/CHZ04BBRSNTxAMhI
# TKMHNeVZDf18nMjmWuOF9daaDx+OpuSEF8HWyp8dAcf9SKcTkjOXIUgy+MIkogCy
# vlPKg24pW4HvOG6A87vsEwvrAgMBAAGjggGAMIIBfDAfBgNVHSUEGDAWBgorBgEE
# AYI3TAgBBggrBgEFBQcDAzAdBgNVHQ4EFgQUy9ZihM9gOer/Z8Jc0si7q7fDE5gw
# UgYDVR0RBEswSaRHMEUxDTALBgNVBAsTBE1PUFIxNDAyBgNVBAUTKzIzMDAxMitj
# ODA0YjVlYS00OWI0LTQyMzgtODM2Mi1kODUxZmEyMjU0ZmMwHwYDVR0jBBgwFoAU
# SG5k5VAF04KqFzc3IrVtqMp1ApUwVAYDVR0fBE0wSzBJoEegRYZDaHR0cDovL3d3
# dy5taWNyb3NvZnQuY29tL3BraW9wcy9jcmwvTWljQ29kU2lnUENBMjAxMV8yMDEx
# LTA3LTA4LmNybDBhBggrBgEFBQcBAQRVMFMwUQYIKwYBBQUHMAKGRWh0dHA6Ly93
# d3cubWljcm9zb2Z0LmNvbS9wa2lvcHMvY2VydHMvTWljQ29kU2lnUENBMjAxMV8y
# MDExLTA3LTA4LmNydDAMBgNVHRMBAf8EAjAAMA0GCSqGSIb3DQEBCwUAA4ICAQAG
# Fh/bV8JQyCNPolF41+34/c291cDx+RtW7VPIaUcF1cTL7OL8mVuVXxE4KMAFRRPg
# mnmIvGar27vrAlUjtz0jeEFtrvjxAFqUmYoczAmV0JocRDCppRbHukdb9Ss0i5+P
# WDfDThyvIsoQzdiCEKk18K4iyI8kpoGL3ycc5GYdiT4u/1cDTcFug6Ay67SzL1BW
# XQaxFYzIHWO3cwzj1nomDyqWRacygz6WPldJdyOJ/rEQx4rlCBVRxStaMVs5apao
# pIhrlihv8cSu6r1FF8xiToG1VBpHjpilbcBuJ8b4Jx/I7SCpC7HxzgualOJqnWmD
# oTbXbSD+hdX/w7iXNgn+PRTBmBSpwIbM74LBq1UkQxi1SIV4htD50p0/GdkUieeN
# n2gkiGg7qceATibnCCFMY/2ckxVNM7VWYE/XSrk4jv8u3bFfpENryXjPsbtrj4Ns
# h3Kq6qX7n90a1jn8ZMltPgjlfIOxrbyjunvPllakeljLEkdi0iHv/DzEMQv3Lz5k
# pTdvYFA/t0SQT6ALi75+WPbHZ4dh256YxMiMy29H4cAulO2x9rAwbexqSajplnbI
# vQjE/jv1rnM3BrJWzxnUu/WUyocc8oBqAU+2G4Fzs9NbIj86WBjfiO5nxEmnL9wl
# iz1e0Ow0RJEdvJEMdoI+78TYLaEEAo5I+e/dAs8DojCCB3owggVioAMCAQICCmEO
# kNIAAAAAAAMwDQYJKoZIhvcNAQELBQAwgYgxCzAJBgNVBAYTAlVTMRMwEQYDVQQI
# EwpXYXNoaW5ndG9uMRAwDgYDVQQHEwdSZWRtb25kMR4wHAYDVQQKExVNaWNyb3Nv
# ZnQgQ29ycG9yYXRpb24xMjAwBgNVBAMTKU1pY3Jvc29mdCBSb290IENlcnRpZmlj
# YXRlIEF1dGhvcml0eSAyMDExMB4XDTExMDcwODIwNTkwOVoXDTI2MDcwODIxMDkw
# OVowfjELMAkGA1UEBhMCVVMxEzARBgNVBAgTCldhc2hpbmd0b24xEDAOBgNVBAcT
# B1JlZG1vbmQxHjAcBgNVBAoTFU1pY3Jvc29mdCBDb3Jwb3JhdGlvbjEoMCYGA1UE
# AxMfTWljcm9zb2Z0IENvZGUgU2lnbmluZyBQQ0EgMjAxMTCCAiIwDQYJKoZIhvcN
# AQEBBQADggIPADCCAgoCggIBAKvw+nIQHC6t2G6qghBNNLrytlghn0IbKmvpWlCq
# uAY4GgRJun/DDB7dN2vGEtgL8DjCmQawyDnVARQxQtOJDXlkh36UYCRsr55JnOlo
# XtLfm1OyCizDr9mpK656Ca/XllnKYBoF6WZ26DJSJhIv56sIUM+zRLdd2MQuA3Wr
# aPPLbfM6XKEW9Ea64DhkrG5kNXimoGMPLdNAk/jj3gcN1Vx5pUkp5w2+oBN3vpQ9
# 7/vjK1oQH01WKKJ6cuASOrdJXtjt7UORg9l7snuGG9k+sYxd6IlPhBryoS9Z5JA7
# La4zWMW3Pv4y07MDPbGyr5I4ftKdgCz1TlaRITUlwzluZH9TupwPrRkjhMv0ugOG
# jfdf8NBSv4yUh7zAIXQlXxgotswnKDglmDlKNs98sZKuHCOnqWbsYR9q4ShJnV+I
# 4iVd0yFLPlLEtVc/JAPw0XpbL9Uj43BdD1FGd7P4AOG8rAKCX9vAFbO9G9RVS+c5
# oQ/pI0m8GLhEfEXkwcNyeuBy5yTfv0aZxe/CHFfbg43sTUkwp6uO3+xbn6/83bBm
# 4sGXgXvt1u1L50kppxMopqd9Z4DmimJ4X7IvhNdXnFy/dygo8e1twyiPLI9AN0/B
# 4YVEicQJTMXUpUMvdJX3bvh4IFgsE11glZo+TzOE2rCIF96eTvSWsLxGoGyY0uDW
# iIwLAgMBAAGjggHtMIIB6TAQBgkrBgEEAYI3FQEEAwIBADAdBgNVHQ4EFgQUSG5k
# 5VAF04KqFzc3IrVtqMp1ApUwGQYJKwYBBAGCNxQCBAweCgBTAHUAYgBDAEEwCwYD
# VR0PBAQDAgGGMA8GA1UdEwEB/wQFMAMBAf8wHwYDVR0jBBgwFoAUci06AjGQQ7kU
# BU7h6qfHMdEjiTQwWgYDVR0fBFMwUTBPoE2gS4ZJaHR0cDovL2NybC5taWNyb3Nv
# ZnQuY29tL3BraS9jcmwvcHJvZHVjdHMvTWljUm9vQ2VyQXV0MjAxMV8yMDExXzAz
# XzIyLmNybDBeBggrBgEFBQcBAQRSMFAwTgYIKwYBBQUHMAKGQmh0dHA6Ly93d3cu
# bWljcm9zb2Z0LmNvbS9wa2kvY2VydHMvTWljUm9vQ2VyQXV0MjAxMV8yMDExXzAz
# XzIyLmNydDCBnwYDVR0gBIGXMIGUMIGRBgkrBgEEAYI3LgMwgYMwPwYIKwYBBQUH
# AgEWM2h0dHA6Ly93d3cubWljcm9zb2Z0LmNvbS9wa2lvcHMvZG9jcy9wcmltYXJ5
# Y3BzLmh0bTBABggrBgEFBQcCAjA0HjIgHQBMAGUAZwBhAGwAXwBwAG8AbABpAGMA
# eQBfAHMAdABhAHQAZQBtAGUAbgB0AC4gHTANBgkqhkiG9w0BAQsFAAOCAgEAZ/KG
# pZjgVHkaLtPYdGcimwuWEeFjkplCln3SeQyQwWVfLiw++MNy0W2D/r4/6ArKO79H
# qaPzadtjvyI1pZddZYSQfYtGUFXYDJJ80hpLHPM8QotS0LD9a+M+By4pm+Y9G6XU
# tR13lDni6WTJRD14eiPzE32mkHSDjfTLJgJGKsKKELukqQUMm+1o+mgulaAqPypr
# WEljHwlpblqYluSD9MCP80Yr3vw70L01724lruWvJ+3Q3fMOr5kol5hNDj0L8giJ
# 1h/DMhji8MUtzluetEk5CsYKwsatruWy2dsViFFFWDgycScaf7H0J/jeLDogaZiy
# WYlobm+nt3TDQAUGpgEqKD6CPxNNZgvAs0314Y9/HG8VfUWnduVAKmWjw11SYobD
# HWM2l4bf2vP48hahmifhzaWX0O5dY0HjWwechz4GdwbRBrF1HxS+YWG18NzGGwS+
# 30HHDiju3mUv7Jf2oVyW2ADWoUa9WfOXpQlLSBCZgB/QACnFsZulP0V3HjXG0qKi
# n3p6IvpIlR+r+0cjgPWe+L9rt0uX4ut1eBrs6jeZeRhL/9azI2h15q/6/IvrC4Dq
# aTuv/DDtBEyO3991bWORPdGdVk5Pv4BXIqF4ETIheu9BCrE/+6jMpF3BoYibV3FW
# TkhFwELJm3ZbCoBIa/15n8G9bW1qyVJzEw16UM0xghXhMIIV3QIBATCBlTB+MQsw
# CQYDVQQGEwJVUzETMBEGA1UECBMKV2FzaGluZ3RvbjEQMA4GA1UEBxMHUmVkbW9u
# ZDEeMBwGA1UEChMVTWljcm9zb2Z0IENvcnBvcmF0aW9uMSgwJgYDVQQDEx9NaWNy
# b3NvZnQgQ29kZSBTaWduaW5nIFBDQSAyMDExAhMzAAAAxOmJ+HqBUOn/AAAAAADE
# MA0GCWCGSAFlAwQCAQUAoIHMMBkGCSqGSIb3DQEJAzEMBgorBgEEAYI3AgEEMBwG
# CisGAQQBgjcCAQsxDjAMBgorBgEEAYI3AgEVMC8GCSqGSIb3DQEJBDEiBCB+JZVP
# B7U2AylbabekU9Np1aELYqHo92uBUnuc/8rkizBgBgorBgEEAYI3AgEMMVIwUKA2
# gDQATQBpAGMAcgBvAHMAbwBmAHQAIABBAHoAdQByAGUAIABQAG8AdwBlAHIAUwBo
# AGUAbABsoRaAFGh0dHA6Ly9Db2RlU2lnbkluZm8gMA0GCSqGSIb3DQEBAQUABIIB
# AD5kc/FeNlcy9BKWRb7TiIpfva9qGxmfWdp9bwpmKrDcWtPn3522FWCcR61Ub2Ld
# tThr7Qura0h+vtZQgilK6OyauHo8KPMHSYwSmjidYeZVOA4AJMmxJx0Mdj6PoZVV
# HkC8BOX5KBh465IjextDi5QTvpS/B8IZwN8T5Jp1bcaGIpjGTUY0s9T7AEW/MWvM
# VkFwCeiG+YtQQDR6tUTKySh/RGEzchMpSzHfBecAOMTOXw/FZfwhytW+HfK0zTE0
# fvH0To2fniXQoW146xoY3nvk6aAmIyKPD4C9dAd20bQpS+3gFp5k9Qcb2pfRhv9X
# 5aeDrwOVUJnC0Ls1q7uZ/yOhghNNMIITSQYKKwYBBAGCNwMDATGCEzkwghM1Bgkq
# hkiG9w0BBwKgghMmMIITIgIBAzEPMA0GCWCGSAFlAwQCAQUAMIIBPQYLKoZIhvcN
# AQkQAQSgggEsBIIBKDCCASQCAQEGCisGAQQBhFkKAwEwMTANBglghkgBZQMEAgEF
# AAQgbYShoOcKr0TJuRuERt6GOA0OLDVx4TuwTYdg+N43euoCBlr54vHKQxgTMjAx
# ODA1MTcyMzE1MzMuMTA5WjAHAgEBgAIB9KCBuaSBtjCBszELMAkGA1UEBhMCVVMx
# EzARBgNVBAgTCldhc2hpbmd0b24xEDAOBgNVBAcTB1JlZG1vbmQxHjAcBgNVBAoT
# FU1pY3Jvc29mdCBDb3Jwb3JhdGlvbjENMAsGA1UECxMETU9QUjEnMCUGA1UECxMe
# bkNpcGhlciBEU0UgRVNOOjdEMkUtMzc4Mi1CMEY3MSUwIwYDVQQDExxNaWNyb3Nv
# ZnQgVGltZS1TdGFtcCBTZXJ2aWNloIIO0DCCBnEwggRZoAMCAQICCmEJgSoAAAAA
# AAIwDQYJKoZIhvcNAQELBQAwgYgxCzAJBgNVBAYTAlVTMRMwEQYDVQQIEwpXYXNo
# aW5ndG9uMRAwDgYDVQQHEwdSZWRtb25kMR4wHAYDVQQKExVNaWNyb3NvZnQgQ29y
# cG9yYXRpb24xMjAwBgNVBAMTKU1pY3Jvc29mdCBSb290IENlcnRpZmljYXRlIEF1
# dGhvcml0eSAyMDEwMB4XDTEwMDcwMTIxMzY1NVoXDTI1MDcwMTIxNDY1NVowfDEL
# MAkGA1UEBhMCVVMxEzARBgNVBAgTCldhc2hpbmd0b24xEDAOBgNVBAcTB1JlZG1v
# bmQxHjAcBgNVBAoTFU1pY3Jvc29mdCBDb3Jwb3JhdGlvbjEmMCQGA1UEAxMdTWlj
# cm9zb2Z0IFRpbWUtU3RhbXAgUENBIDIwMTAwggEiMA0GCSqGSIb3DQEBAQUAA4IB
# DwAwggEKAoIBAQCpHQ28dxGKOiDs/BOX9fp/aZRrdFQQ1aUKAIKF++18aEssX8XD
# 5WHCdrc+Zitb8BVTJwQxH0EbGpUdzgkTjnxhMFmxMEQP8WCIhFRDDNdNuDgIs0Ld
# k6zWczBXJoKjRQ3Q6vVHgc2/JGAyWGBG8lhHhjKEHnRhZ5FfgVSxz5NMksHEpl3R
# YRNuKMYa+YaAu99h/EbBJx0kZxJyGiGKr0tkiVBisV39dx898Fd1rL2KQk1AUdEP
# nAY+Z3/1ZsADlkR+79BL/W7lmsqxqPJ6Kgox8NpOBpG2iAg16HgcsOmZzTznL0S6
# p/TcZL2kAcEgCZN4zfy8wMlEXV4WnAEFTyJNAgMBAAGjggHmMIIB4jAQBgkrBgEE
# AYI3FQEEAwIBADAdBgNVHQ4EFgQU1WM6XIoxkPNDe3xGG8UzaFqFbVUwGQYJKwYB
# BAGCNxQCBAweCgBTAHUAYgBDAEEwCwYDVR0PBAQDAgGGMA8GA1UdEwEB/wQFMAMB
# Af8wHwYDVR0jBBgwFoAU1fZWy4/oolxiaNE9lJBb186aGMQwVgYDVR0fBE8wTTBL
# oEmgR4ZFaHR0cDovL2NybC5taWNyb3NvZnQuY29tL3BraS9jcmwvcHJvZHVjdHMv
# TWljUm9vQ2VyQXV0XzIwMTAtMDYtMjMuY3JsMFoGCCsGAQUFBwEBBE4wTDBKBggr
# BgEFBQcwAoY+aHR0cDovL3d3dy5taWNyb3NvZnQuY29tL3BraS9jZXJ0cy9NaWNS
# b29DZXJBdXRfMjAxMC0wNi0yMy5jcnQwgaAGA1UdIAEB/wSBlTCBkjCBjwYJKwYB
# BAGCNy4DMIGBMD0GCCsGAQUFBwIBFjFodHRwOi8vd3d3Lm1pY3Jvc29mdC5jb20v
# UEtJL2RvY3MvQ1BTL2RlZmF1bHQuaHRtMEAGCCsGAQUFBwICMDQeMiAdAEwAZQBn
# AGEAbABfAFAAbwBsAGkAYwB5AF8AUwB0AGEAdABlAG0AZQBuAHQALiAdMA0GCSqG
# SIb3DQEBCwUAA4ICAQAH5ohRDeLG4Jg/gXEDPZ2joSFvs+umzPUxvs8F4qn++ldt
# GTCzwsVmyWrf9efweL3HqJ4l4/m87WtUVwgrUYJEEvu5U4zM9GASinbMQEBBm9xc
# F/9c+V4XNZgkVkt070IQyK+/f8Z/8jd9Wj8c8pl5SpFSAK84Dxf1L3mBZdmptWvk
# x872ynoAb0swRCQiPM/tA6WWj1kpvLb9BOFwnzJKJ/1Vry/+tuWOM7tiX5rbV0Dp
# 8c6ZZpCM/2pif93FSguRJuI57BlKcWOdeyFtw5yjojz6f32WapB4pm3S4Zz5Hfw4
# 2JT0xqUKloakvZ4argRCg7i1gJsiOCC1JeVk7Pf0v35jWSUPei45V3aicaoGig+J
# FrphpxHLmtgOR5qAxdDNp9DvfYPw4TtxCd9ddJgiCGHasFAeb73x4QDf5zEHpJM6
# 92VHeOj4qEir995yfmFrb3epgcunCaw5u+zGy9iCtHLNHfS4hQEegPsbiSpUObJb
# 2sgNVZl6h3M7COaYLeqN4DMuEin1wC9UJyH3yKxO2ii4sanblrKnQqLJzxlBTeCG
# +SqaoxFmMNO7dDJL32N79ZmKLxvHIa9Zta7cRDyXUHHXodLFVeNp3lfB0d4wwP3M
# 5k37Db9dT+mdHhk4L7zPWAUu7w2gUDXa7wknHNWzfjUeCLraNtvTX4/edIhJEjCC
# BNowggPCoAMCAQICEzMAAACiTI4d2qkhfIQAAAAAAKIwDQYJKoZIhvcNAQELBQAw
# fDELMAkGA1UEBhMCVVMxEzARBgNVBAgTCldhc2hpbmd0b24xEDAOBgNVBAcTB1Jl
# ZG1vbmQxHjAcBgNVBAoTFU1pY3Jvc29mdCBDb3Jwb3JhdGlvbjEmMCQGA1UEAxMd
# TWljcm9zb2Z0IFRpbWUtU3RhbXAgUENBIDIwMTAwHhcNMTYwOTA3MTc1NjQ5WhcN
# MTgwOTA3MTc1NjQ5WjCBszELMAkGA1UEBhMCVVMxEzARBgNVBAgTCldhc2hpbmd0
# b24xEDAOBgNVBAcTB1JlZG1vbmQxHjAcBgNVBAoTFU1pY3Jvc29mdCBDb3Jwb3Jh
# dGlvbjENMAsGA1UECxMETU9QUjEnMCUGA1UECxMebkNpcGhlciBEU0UgRVNOOjdE
# MkUtMzc4Mi1CMEY3MSUwIwYDVQQDExxNaWNyb3NvZnQgVGltZS1TdGFtcCBTZXJ2
# aWNlMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEApgF3BXvDfQ52aL3G
# qIPGgnsBcKiwaoRyT1SObb5nIGq+7C3dL0dx4ZL9dGJrvnTbhTbbNMjHaQrmNhJJ
# QEe4QTRZYj3xE6euCQEo0RRYYx85sGg2BNhZ2k1b4JFxEvxBsw3OwXKhFSb285lb
# 6OCKrhB1qjnX8Q7yCcExdQwpKind7I43Kt9rquMyuNhNe8hxEJDBvjqGGQvo6a0f
# uDQjrWGMli77PkwvQmXGCx6xsFjCa5vnz4sEx5NBneZ5uOX3llfcgMUFBQCmQSI3
# Fvm060esLzmt0MXTDETXCVtp0QnzAytjJ1oHkPTvjKMzJY03LD8lmbPzFT6mkur5
# URjl1QIDAQABo4IBGzCCARcwHQYDVR0OBBYEFG672cHC2hawfK3CU3/n0BcTPbxX
# MB8GA1UdIwQYMBaAFNVjOlyKMZDzQ3t8RhvFM2hahW1VMFYGA1UdHwRPME0wS6BJ
# oEeGRWh0dHA6Ly9jcmwubWljcm9zb2Z0LmNvbS9wa2kvY3JsL3Byb2R1Y3RzL01p
# Y1RpbVN0YVBDQV8yMDEwLTA3LTAxLmNybDBaBggrBgEFBQcBAQROMEwwSgYIKwYB
# BQUHMAKGPmh0dHA6Ly93d3cubWljcm9zb2Z0LmNvbS9wa2kvY2VydHMvTWljVGlt
# U3RhUENBXzIwMTAtMDctMDEuY3J0MAwGA1UdEwEB/wQCMAAwEwYDVR0lBAwwCgYI
# KwYBBQUHAwgwDQYJKoZIhvcNAQELBQADggEBADWZV20z9kidnkHczKlg7lxHSFQR
# Coa5Vz+nbZiOynxppmqWg845sr1kDpkwu77c4HWCa0Ip4YVEjjF7c2hZeZidV7QW
# B/yiKbyjcIIhJh1lSxnmiSpVza+6kmreyJoJAlslFpfHq7la2vTzoBuCcKpKxka1
# eoDEYkKD93FaZCsm/fOOIwtOFvIb8tA1CkPaPPOpGpGKxDV42RCoYwajZH+svyju
# qBwVeI+g98Jxxdi4ks6ql3I5TA9oZEROyoblLcuyArEoPf0ZvwDWSNPfDbTtDCSQ
# RRS8lXk6A+xjhjw07nGyPS5qeZCCtusbGlm7r4uLefGp/Uox8jxqGxVdOsahggN5
# MIICYQIBATCB46GBuaSBtjCBszELMAkGA1UEBhMCVVMxEzARBgNVBAgTCldhc2hp
# bmd0b24xEDAOBgNVBAcTB1JlZG1vbmQxHjAcBgNVBAoTFU1pY3Jvc29mdCBDb3Jw
# b3JhdGlvbjENMAsGA1UECxMETU9QUjEnMCUGA1UECxMebkNpcGhlciBEU0UgRVNO
# OjdEMkUtMzc4Mi1CMEY3MSUwIwYDVQQDExxNaWNyb3NvZnQgVGltZS1TdGFtcCBT
# ZXJ2aWNloiUKAQEwCQYFKw4DAhoFAAMVAF4vF+lxhNIyy+zXXko7+E63h+n1oIHC
# MIG/pIG8MIG5MQswCQYDVQQGEwJVUzETMBEGA1UECBMKV2FzaGluZ3RvbjEQMA4G
# A1UEBxMHUmVkbW9uZDEeMBwGA1UEChMVTWljcm9zb2Z0IENvcnBvcmF0aW9uMQ0w
# CwYDVQQLEwRNT1BSMScwJQYDVQQLEx5uQ2lwaGVyIE5UUyBFU046NTdGNi1DMUUw
# LTU1NEMxKzApBgNVBAMTIk1pY3Jvc29mdCBUaW1lIFNvdXJjZSBNYXN0ZXIgQ2xv
# Y2swDQYJKoZIhvcNAQEFBQACBQDep/PdMCIYDzIwMTgwNTE3MTIyODEzWhgPMjAx
# ODA1MTgxMjI4MTNaMHcwPQYKKwYBBAGEWQoEATEvMC0wCgIFAN6n890CAQAwCgIB
# AAICG0MCAf8wBwIBAAICGgUwCgIFAN6pRV0CAQAwNgYKKwYBBAGEWQoEAjEoMCYw
# DAYKKwYBBAGEWQoDAaAKMAgCAQACAxbjYKEKMAgCAQACAwehIDANBgkqhkiG9w0B
# AQUFAAOCAQEAqbEFTKodpg/rHY5Tg9CGsrp6lm0adqdCjlzlpavANBY2aRe0iJSv
# QO9SDFxvAAy6Yj4UcFWizlUVYgg20d82z5eYy8K6CO/Bm5uaMsGFn+IgYLmzGW6j
# e08J0vaNyQdOsvHn2Kh6dX3bSNvJSf2I+f5YS77yHpImwXgrd1LSDz5K9VFnwYPH
# R4cSpSoHLvkTEghMouapSZVnOqXKeGWrlm0rSecJnfohQSBAdkj/IOUTXLMEtbO0
# Ti28bQncrXrNircjZrT2J2hOObwqvbW9SNETyZ5YAMSePCPcJxqJgm0wtj9oTbD0
# c7pAzJ6pxtJC9mEuP27mBB2tlzBuMwU0uzGCAvUwggLxAgEBMIGTMHwxCzAJBgNV
# BAYTAlVTMRMwEQYDVQQIEwpXYXNoaW5ndG9uMRAwDgYDVQQHEwdSZWRtb25kMR4w
# HAYDVQQKExVNaWNyb3NvZnQgQ29ycG9yYXRpb24xJjAkBgNVBAMTHU1pY3Jvc29m
# dCBUaW1lLVN0YW1wIFBDQSAyMDEwAhMzAAAAokyOHdqpIXyEAAAAAACiMA0GCWCG
# SAFlAwQCAQUAoIIBMjAaBgkqhkiG9w0BCQMxDQYLKoZIhvcNAQkQAQQwLwYJKoZI
# hvcNAQkEMSIEIGIepOU8ty7MsS9inkYktF1sxTte7pbgFkDJeMFXHTOtMIHiBgsq
# hkiG9w0BCRACDDGB0jCBzzCBzDCBsQQUXi8X6XGE0jLL7NdeSjv4TreH6fUwgZgw
# gYCkfjB8MQswCQYDVQQGEwJVUzETMBEGA1UECBMKV2FzaGluZ3RvbjEQMA4GA1UE
# BxMHUmVkbW9uZDEeMBwGA1UEChMVTWljcm9zb2Z0IENvcnBvcmF0aW9uMSYwJAYD
# VQQDEx1NaWNyb3NvZnQgVGltZS1TdGFtcCBQQ0EgMjAxMAITMwAAAKJMjh3aqSF8
# hAAAAAAAojAWBBRbT1+tizILpyt9iS5snQQhdNmoUzANBgkqhkiG9w0BAQsFAASC
# AQCE+H6uAkH8jNKCbMUDqs1nKCgQiHvdanWECRL+zPP+jh2tX3mx3TcvjI7P89GQ
# kkvDP1Wn6n99JcBTIQMwTCabJNwoRhX1TbZOfEMWpcep4Ploz2XSFZCLKhX7tOIm
# 8eVDfeTVdEI63HJvQR9cNqauvNVoYM9pGALGRJFSGRuBqhmaMlkL/Krd1ub7RrRN
# V+ouV3NnP5H8SyRw7u+D1ejTiQjaQHq90e9GCR2JNXHFj8+WD5bpUacphC1uG696
# DjpaZoOSNaX6lZZTmHzgJ4yZoYAv6H2hiFq1gE49fktcsNODRdYOA+TONwMEtLw0
# bvJE8OfZgJ2vdppcZJ5QBQh6
# SIG # End signature block