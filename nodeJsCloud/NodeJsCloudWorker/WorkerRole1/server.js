var http = require('http');
const net = require('net');
const Parser = require('teltonika-parser');
const binutils = require('binutils64');
var fs = require("fs");

var port = process.env.port || 1337;
var tcpport = process.env.tcpport || 8000;

// create a custom timestamp format for log statements
const SimpleNodeLogger = require('simple-node-logger'),
    opts = {
        logFilePath:'tracker.log',
        timestampFormat:'YYYY-MM-DD HH:mm:ss.SSS'
    },
log = SimpleNodeLogger.createSimpleLogger( opts );

http.createServer(function (req, res) {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
   // res.end('Hello World\n');

    fs.readFile("tracker.log", function(err, buf) {
        res.end(buf.toString());
        console.log(buf.toString());
      });

}).listen(port);

log.info("http Server Started");

let server = net.createServer((c) => {
 console.log("Client connected");
 c.on('end', () => {
     console.log("Client disconnected");
     log.info("Client disconnected");
 });

 c.on('data', (data) => {
     let buffer = data;
     let parser = new Parser(buffer);
     if(parser.isImei){
         c.write(Buffer.alloc(1, 1));
         console.log("Sending server welcome");
         log.info("Sending server welcome");
     }else {
         console.log("Received data packet");
         log.info("Received data packet");

         let avl = parser.getAvl();

         for (i = 0; i < avl.number_of_data; i++) { 
            let record = avl.records[i];

            console.log(">>>>>>>>>>>>>>>>>>");
            console.log("Record n." + i);
            console.log("Timestamp: " + record.timestamp);
            console.log("Position: " + record.gps.longitude + ", " + record.gps.latitude);
            
            log.info(">>>>>>>>>>>>>>>>>>");
            log.info("Record n." + i);
            log.info("Timestamp: " + record.timestamp);
            log.info("Position: " + record.gps.longitude + ", " + record.gps.latitude);
            
            console.log("IO Elements: ");
            log.info("IO Elements: ");
            
            for (j = 0; j < record.properties_count; j++) { 
                let ioElement = record.ioElements[j];
                console.log(j + ") ID: " + ioElement.id + " Value: " + ioElement.value);
                log.info(j + ") ID: " + ioElement.id + " Value: " + ioElement.value);
            }

            console.log("<<<<<<<<<<<<<<<<<<");
            log.info("<<<<<<<<<<<<<<<<<<");
         }

         console.log("Sending data response");
         log.info("Sending data response");

         let writer = new binutils.BinaryWriter();
         writer.WriteInt32(avl.number_of_data);

         let response = writer.ByteBuffer;
         c.write(response);
     }
 });

});

server.listen(tcpport, () => { console.log("Server started"); });

/*
net.createServer(function (socket) {
	socket.write('Echo server\r\n');
	socket.pipe(socket);
}).listen(tcpport);
*/

/*
var http = require('http');
var port = process.env.port || 1337;
http.createServer(function (req, res) {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Hello World\n');
}).listen(port);
*/

// SIG // Begin signature block
// SIG // MIIkJAYJKoZIhvcNAQcCoIIkFTCCJBECAQExDzANBglg
// SIG // hkgBZQMEAgEFADB3BgorBgEEAYI3AgEEoGkwZzAyBgor
// SIG // BgEEAYI3AgEeMCQCAQEEEBDgyQbOONQRoqMAEEvTUJAC
// SIG // AQACAQACAQACAQACAQAwMTANBglghkgBZQMEAgEFAAQg
// SIG // b4LleNQ+S3eImQx5mgXP5huyIfNNyR/clcBEUmqq7Rag
// SIG // gg2DMIIGATCCA+mgAwIBAgITMwAAAMTpifh6gVDp/wAA
// SIG // AAAAxDANBgkqhkiG9w0BAQsFADB+MQswCQYDVQQGEwJV
// SIG // UzETMBEGA1UECBMKV2FzaGluZ3RvbjEQMA4GA1UEBxMH
// SIG // UmVkbW9uZDEeMBwGA1UEChMVTWljcm9zb2Z0IENvcnBv
// SIG // cmF0aW9uMSgwJgYDVQQDEx9NaWNyb3NvZnQgQ29kZSBT
// SIG // aWduaW5nIFBDQSAyMDExMB4XDTE3MDgxMTIwMjAyNFoX
// SIG // DTE4MDgxMTIwMjAyNFowdDELMAkGA1UEBhMCVVMxEzAR
// SIG // BgNVBAgTCldhc2hpbmd0b24xEDAOBgNVBAcTB1JlZG1v
// SIG // bmQxHjAcBgNVBAoTFU1pY3Jvc29mdCBDb3Jwb3JhdGlv
// SIG // bjEeMBwGA1UEAxMVTWljcm9zb2Z0IENvcnBvcmF0aW9u
// SIG // MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA
// SIG // iIq4JMMHj5qAeRX8JmD8cogs+vSjl4iWRrejy1+JLzoz
// SIG // Lh6RePp8qR+CAbV6yxq8A8pG68WZ9/sEHfKFCv8ibqHy
// SIG // Zz3FJxjlKB/1BJRBY+zjuhWM7ROaNd44cFRvO+ytRQkw
// SIG // ScG+jzCZDMt2yfdzlRZ30Yu7lMcIhSDtHqg18XHC4HQA
// SIG // S4rS3JHr1nj+jfqtYIg9vbkfrmKXv8WEsZCu1q8r01T7
// SIG // NdrNcZLmHv/scWvLfwh2dOAQUUjU8QDISEyjBzXlWQ39
// SIG // fJzI5lrjhfXWmg8fjqbkhBfB1sqfHQHH/UinE5IzlyFI
// SIG // MvjCJKIAsr5TyoNuKVuB7zhugPO77BML6wIDAQABo4IB
// SIG // gDCCAXwwHwYDVR0lBBgwFgYKKwYBBAGCN0wIAQYIKwYB
// SIG // BQUHAwMwHQYDVR0OBBYEFMvWYoTPYDnq/2fCXNLIu6u3
// SIG // wxOYMFIGA1UdEQRLMEmkRzBFMQ0wCwYDVQQLEwRNT1BS
// SIG // MTQwMgYDVQQFEysyMzAwMTIrYzgwNGI1ZWEtNDliNC00
// SIG // MjM4LTgzNjItZDg1MWZhMjI1NGZjMB8GA1UdIwQYMBaA
// SIG // FEhuZOVQBdOCqhc3NyK1bajKdQKVMFQGA1UdHwRNMEsw
// SIG // SaBHoEWGQ2h0dHA6Ly93d3cubWljcm9zb2Z0LmNvbS9w
// SIG // a2lvcHMvY3JsL01pY0NvZFNpZ1BDQTIwMTFfMjAxMS0w
// SIG // Ny0wOC5jcmwwYQYIKwYBBQUHAQEEVTBTMFEGCCsGAQUF
// SIG // BzAChkVodHRwOi8vd3d3Lm1pY3Jvc29mdC5jb20vcGtp
// SIG // b3BzL2NlcnRzL01pY0NvZFNpZ1BDQTIwMTFfMjAxMS0w
// SIG // Ny0wOC5jcnQwDAYDVR0TAQH/BAIwADANBgkqhkiG9w0B
// SIG // AQsFAAOCAgEABhYf21fCUMgjT6JReNft+P3NvdXA8fkb
// SIG // Vu1TyGlHBdXEy+zi/JlblV8ROCjABUUT4Jp5iLxmq9u7
// SIG // 6wJVI7c9I3hBba748QBalJmKHMwJldCaHEQwqaUWx7pH
// SIG // W/UrNIufj1g3w04cryLKEM3YghCpNfCuIsiPJKaBi98n
// SIG // HORmHYk+Lv9XA03BboOgMuu0sy9QVl0GsRWMyB1jt3MM
// SIG // 49Z6Jg8qlkWnMoM+lj5XSXcjif6xEMeK5QgVUcUrWjFb
// SIG // OWqWqKSIa5Yob/HEruq9RRfMYk6BtVQaR46YpW3AbifG
// SIG // +CcfyO0gqQux8c4LmpTiap1pg6E2120g/oXV/8O4lzYJ
// SIG // /j0UwZgUqcCGzO+CwatVJEMYtUiFeIbQ+dKdPxnZFInn
// SIG // jZ9oJIhoO6nHgE4m5wghTGP9nJMVTTO1VmBP10q5OI7/
// SIG // Lt2xX6RDa8l4z7G7a4+DbIdyquql+5/dGtY5/GTJbT4I
// SIG // 5XyDsa28o7p7z5ZWpHpYyxJHYtIh7/w8xDEL9y8+ZKU3
// SIG // b2BQP7dEkE+gC4u+flj2x2eHYduemMTIjMtvR+HALpTt
// SIG // sfawMG3sakmo6ZZ2yL0IxP479a5zNwayVs8Z1Lv1lMqH
// SIG // HPKAagFPthuBc7PTWyI/OlgY34juZ8RJpy/cJYs9XtDs
// SIG // NESRHbyRDHaCPu/E2C2hBAKOSPnv3QLPA6Iwggd6MIIF
// SIG // YqADAgECAgphDpDSAAAAAAADMA0GCSqGSIb3DQEBCwUA
// SIG // MIGIMQswCQYDVQQGEwJVUzETMBEGA1UECBMKV2FzaGlu
// SIG // Z3RvbjEQMA4GA1UEBxMHUmVkbW9uZDEeMBwGA1UEChMV
// SIG // TWljcm9zb2Z0IENvcnBvcmF0aW9uMTIwMAYDVQQDEylN
// SIG // aWNyb3NvZnQgUm9vdCBDZXJ0aWZpY2F0ZSBBdXRob3Jp
// SIG // dHkgMjAxMTAeFw0xMTA3MDgyMDU5MDlaFw0yNjA3MDgy
// SIG // MTA5MDlaMH4xCzAJBgNVBAYTAlVTMRMwEQYDVQQIEwpX
// SIG // YXNoaW5ndG9uMRAwDgYDVQQHEwdSZWRtb25kMR4wHAYD
// SIG // VQQKExVNaWNyb3NvZnQgQ29ycG9yYXRpb24xKDAmBgNV
// SIG // BAMTH01pY3Jvc29mdCBDb2RlIFNpZ25pbmcgUENBIDIw
// SIG // MTEwggIiMA0GCSqGSIb3DQEBAQUAA4ICDwAwggIKAoIC
// SIG // AQCr8PpyEBwurdhuqoIQTTS68rZYIZ9CGypr6VpQqrgG
// SIG // OBoESbp/wwwe3TdrxhLYC/A4wpkGsMg51QEUMULTiQ15
// SIG // ZId+lGAkbK+eSZzpaF7S35tTsgosw6/ZqSuuegmv15ZZ
// SIG // ymAaBelmdugyUiYSL+erCFDPs0S3XdjELgN1q2jzy23z
// SIG // OlyhFvRGuuA4ZKxuZDV4pqBjDy3TQJP4494HDdVceaVJ
// SIG // KecNvqATd76UPe/74ytaEB9NViiienLgEjq3SV7Y7e1D
// SIG // kYPZe7J7hhvZPrGMXeiJT4Qa8qEvWeSQOy2uM1jFtz7+
// SIG // MtOzAz2xsq+SOH7SnYAs9U5WkSE1JcM5bmR/U7qcD60Z
// SIG // I4TL9LoDho33X/DQUr+MlIe8wCF0JV8YKLbMJyg4JZg5
// SIG // SjbPfLGSrhwjp6lm7GEfauEoSZ1fiOIlXdMhSz5SxLVX
// SIG // PyQD8NF6Wy/VI+NwXQ9RRnez+ADhvKwCgl/bwBWzvRvU
// SIG // VUvnOaEP6SNJvBi4RHxF5MHDcnrgcuck379GmcXvwhxX
// SIG // 24ON7E1JMKerjt/sW5+v/N2wZuLBl4F77dbtS+dJKacT
// SIG // KKanfWeA5opieF+yL4TXV5xcv3coKPHtbcMojyyPQDdP
// SIG // weGFRInECUzF1KVDL3SV9274eCBYLBNdYJWaPk8zhNqw
// SIG // iBfenk70lrC8RqBsmNLg1oiMCwIDAQABo4IB7TCCAekw
// SIG // EAYJKwYBBAGCNxUBBAMCAQAwHQYDVR0OBBYEFEhuZOVQ
// SIG // BdOCqhc3NyK1bajKdQKVMBkGCSsGAQQBgjcUAgQMHgoA
// SIG // UwB1AGIAQwBBMAsGA1UdDwQEAwIBhjAPBgNVHRMBAf8E
// SIG // BTADAQH/MB8GA1UdIwQYMBaAFHItOgIxkEO5FAVO4eqn
// SIG // xzHRI4k0MFoGA1UdHwRTMFEwT6BNoEuGSWh0dHA6Ly9j
// SIG // cmwubWljcm9zb2Z0LmNvbS9wa2kvY3JsL3Byb2R1Y3Rz
// SIG // L01pY1Jvb0NlckF1dDIwMTFfMjAxMV8wM18yMi5jcmww
// SIG // XgYIKwYBBQUHAQEEUjBQME4GCCsGAQUFBzAChkJodHRw
// SIG // Oi8vd3d3Lm1pY3Jvc29mdC5jb20vcGtpL2NlcnRzL01p
// SIG // Y1Jvb0NlckF1dDIwMTFfMjAxMV8wM18yMi5jcnQwgZ8G
// SIG // A1UdIASBlzCBlDCBkQYJKwYBBAGCNy4DMIGDMD8GCCsG
// SIG // AQUFBwIBFjNodHRwOi8vd3d3Lm1pY3Jvc29mdC5jb20v
// SIG // cGtpb3BzL2RvY3MvcHJpbWFyeWNwcy5odG0wQAYIKwYB
// SIG // BQUHAgIwNB4yIB0ATABlAGcAYQBsAF8AcABvAGwAaQBj
// SIG // AHkAXwBzAHQAYQB0AGUAbQBlAG4AdAAuIB0wDQYJKoZI
// SIG // hvcNAQELBQADggIBAGfyhqWY4FR5Gi7T2HRnIpsLlhHh
// SIG // Y5KZQpZ90nkMkMFlXy4sPvjDctFtg/6+P+gKyju/R6mj
// SIG // 82nbY78iNaWXXWWEkH2LRlBV2AySfNIaSxzzPEKLUtCw
// SIG // /WvjPgcuKZvmPRul1LUdd5Q54ulkyUQ9eHoj8xN9ppB0
// SIG // g430yyYCRirCihC7pKkFDJvtaPpoLpWgKj8qa1hJYx8J
// SIG // aW5amJbkg/TAj/NGK978O9C9Ne9uJa7lryft0N3zDq+Z
// SIG // KJeYTQ49C/IIidYfwzIY4vDFLc5bnrRJOQrGCsLGra7l
// SIG // stnbFYhRRVg4MnEnGn+x9Cf43iw6IGmYslmJaG5vp7d0
// SIG // w0AFBqYBKig+gj8TTWYLwLNN9eGPfxxvFX1Fp3blQCpl
// SIG // o8NdUmKGwx1jNpeG39rz+PIWoZon4c2ll9DuXWNB41sH
// SIG // nIc+BncG0QaxdR8UvmFhtfDcxhsEvt9Bxw4o7t5lL+yX
// SIG // 9qFcltgA1qFGvVnzl6UJS0gQmYAf0AApxbGbpT9Fdx41
// SIG // xtKiop96eiL6SJUfq/tHI4D1nvi/a7dLl+LrdXga7Oo3
// SIG // mXkYS//WsyNodeav+vyL6wuA6mk7r/ww7QRMjt/fdW1j
// SIG // kT3RnVZOT7+AVyKheBEyIXrvQQqxP/uozKRdwaGIm1dx
// SIG // Vk5IRcBCyZt2WwqASGv9eZ/BvW1taslScxMNelDNMYIV
// SIG // +TCCFfUCAQEwgZUwfjELMAkGA1UEBhMCVVMxEzARBgNV
// SIG // BAgTCldhc2hpbmd0b24xEDAOBgNVBAcTB1JlZG1vbmQx
// SIG // HjAcBgNVBAoTFU1pY3Jvc29mdCBDb3Jwb3JhdGlvbjEo
// SIG // MCYGA1UEAxMfTWljcm9zb2Z0IENvZGUgU2lnbmluZyBQ
// SIG // Q0EgMjAxMQITMwAAAMTpifh6gVDp/wAAAAAAxDANBglg
// SIG // hkgBZQMEAgEFAKCBzDAZBgkqhkiG9w0BCQMxDAYKKwYB
// SIG // BAGCNwIBBDAcBgorBgEEAYI3AgELMQ4wDAYKKwYBBAGC
// SIG // NwIBFTAvBgkqhkiG9w0BCQQxIgQgW/VcItUgPqh6z3q2
// SIG // GU48grwctojmpLN3536OLQ/LtSUwYAYKKwYBBAGCNwIB
// SIG // DDFSMFCgNoA0AE0AaQBjAHIAbwBzAG8AZgB0ACAAQQB6
// SIG // AHUAcgBlACAAUABvAHcAZQByAFMAaABlAGwAbKEWgBRo
// SIG // dHRwOi8vQ29kZVNpZ25JbmZvIDANBgkqhkiG9w0BAQEF
// SIG // AASCAQAj4WUp+f2Zk78kDaD+1+L0i1c/qaZNAt145B32
// SIG // d5v6TNzwVCGmhddGNfSgEswgSewRtk7MPPjswADz3NWf
// SIG // 1+pz2nyGDyPM2/JpsDPVxTwdmR8zWYlby6nbjLjATx3r
// SIG // 2rWjEIvHA+p58l66zFWZM24onFdLgVnbvEzoEudM/Mx0
// SIG // AITemszxKu6X88lCwJEHEuVproDB9chAQUTXPvVm31YN
// SIG // qKkBZtJtuUn+KxV16BKzOLSxv6/+prl98/0zzLPnQVAy
// SIG // 2GLEoCVLsJ7FXzfg8WqPObR5Ql59lmeCs6GjxeVjCCGX
// SIG // TM9uSJfhJUGu9pofPCuOZT4gdFpHJVkN+Cni6k/NoYIT
// SIG // ZTCCE2EGCisGAQQBgjcDAwExghNRMIITTQYJKoZIhvcN
// SIG // AQcCoIITPjCCEzoCAQMxDzANBglghkgBZQMEAgEFADCC
// SIG // AT0GCyqGSIb3DQEJEAEEoIIBLASCASgwggEkAgEBBgor
// SIG // BgEEAYRZCgMBMDEwDQYJYIZIAWUDBAIBBQAEIJKg7mN+
// SIG // aQttMd/mC2XfdBEutnWz0QsccmCor9ijbPxWAgZa82xU
// SIG // Gf8YEzIwMTgwNTE3MjMxNTMwLjg3NlowBwIBAYACAfSg
// SIG // gbmkgbYwgbMxCzAJBgNVBAYTAlVTMRMwEQYDVQQIEwpX
// SIG // YXNoaW5ndG9uMRAwDgYDVQQHEwdSZWRtb25kMR4wHAYD
// SIG // VQQKExVNaWNyb3NvZnQgQ29ycG9yYXRpb24xDTALBgNV
// SIG // BAsTBE1PUFIxJzAlBgNVBAsTHm5DaXBoZXIgRFNFIEVT
// SIG // Tjo5OEZELUM2MUUtRTY0MTElMCMGA1UEAxMcTWljcm9z
// SIG // b2Z0IFRpbWUtU3RhbXAgU2VydmljZaCCDtAwggTaMIID
// SIG // wqADAgECAhMzAAAAnSCcVndV1CiaAAAAAACdMA0GCSqG
// SIG // SIb3DQEBCwUAMHwxCzAJBgNVBAYTAlVTMRMwEQYDVQQI
// SIG // EwpXYXNoaW5ndG9uMRAwDgYDVQQHEwdSZWRtb25kMR4w
// SIG // HAYDVQQKExVNaWNyb3NvZnQgQ29ycG9yYXRpb24xJjAk
// SIG // BgNVBAMTHU1pY3Jvc29mdCBUaW1lLVN0YW1wIFBDQSAy
// SIG // MDEwMB4XDTE2MDkwNzE3NTY0MVoXDTE4MDkwNzE3NTY0
// SIG // MVowgbMxCzAJBgNVBAYTAlVTMRMwEQYDVQQIEwpXYXNo
// SIG // aW5ndG9uMRAwDgYDVQQHEwdSZWRtb25kMR4wHAYDVQQK
// SIG // ExVNaWNyb3NvZnQgQ29ycG9yYXRpb24xDTALBgNVBAsT
// SIG // BE1PUFIxJzAlBgNVBAsTHm5DaXBoZXIgRFNFIEVTTjo5
// SIG // OEZELUM2MUUtRTY0MTElMCMGA1UEAxMcTWljcm9zb2Z0
// SIG // IFRpbWUtU3RhbXAgU2VydmljZTCCASIwDQYJKoZIhvcN
// SIG // AQEBBQADggEPADCCAQoCggEBANJEmJwRWioaLqqfU11t
// SIG // Xby2WXaRwCZbA+bIbF+jKutMAEZ0OBS/KnhdsCNM7G5g
// SIG // SOxJ5Ft1pnD989SuVW6OvQQfZz0Z/TFygpShc7EuvPAc
// SIG // 1NvvIbjGqbTGwkYHLpnMPiELwy5I3wxqdcU1jtdZnKs7
// SIG // SH6esuD8VJbeE0c5QtBu1kv9vwyk8Avl+ujIiIvunPt1
// SIG // 4cRL6MsOZM5X3mCoekrOZRy4ZZYjYjt/BU9ZZt3pDdX4
// SIG // fL7ATN57CpYbzFU5BG8GCEE4u/UZ37V6BHcFHOLsjMfx
// SIG // sZpeR27Msh6j2pZ4ge7wB5iAUb66ChQefp46WSShV3MM
// SIG // /kFETpbCVFEPqcUCAwEAAaOCARswggEXMB0GA1UdDgQW
// SIG // BBS8hgjKW2payuS9zMuCtBVI6ofloTAfBgNVHSMEGDAW
// SIG // gBTVYzpcijGQ80N7fEYbxTNoWoVtVTBWBgNVHR8ETzBN
// SIG // MEugSaBHhkVodHRwOi8vY3JsLm1pY3Jvc29mdC5jb20v
// SIG // cGtpL2NybC9wcm9kdWN0cy9NaWNUaW1TdGFQQ0FfMjAx
// SIG // MC0wNy0wMS5jcmwwWgYIKwYBBQUHAQEETjBMMEoGCCsG
// SIG // AQUFBzAChj5odHRwOi8vd3d3Lm1pY3Jvc29mdC5jb20v
// SIG // cGtpL2NlcnRzL01pY1RpbVN0YVBDQV8yMDEwLTA3LTAx
// SIG // LmNydDAMBgNVHRMBAf8EAjAAMBMGA1UdJQQMMAoGCCsG
// SIG // AQUFBwMIMA0GCSqGSIb3DQEBCwUAA4IBAQB/3iQhvVnv
// SIG // tNaLccpZkb4uqEaCu4/fZB195ioLvChnS/75d7+19E6k
// SIG // /ehKDz5nIrNWiW2XCFrsIxT1eSoTV4ySF50GIerzqOob
// SIG // O9zbhJpL93IV9p+PJ6j/peLWIImVTUCpFWBeuZcB1zAL
// SIG // /0Jqa1bZ7FpcNgOAzBYtasG5M2RP215rf9hvwK6BpTjt
// SIG // Os5dchqMTBXLX5OMst2qAC3j/WQoqam+EB3+Fdwnjx+O
// SIG // pAPqjjfbBCVTH+Eyevc7IpDM3CoNwV6GCdU+Vu+rJaB6
// SIG // yzJAWPa9CVu2yf97R3l0hqWGndgiDVde4agNxiZOAvb9
// SIG // OvYBrPeXvLmRDmHbndPvpjZpMIIGcTCCBFmgAwIBAgIK
// SIG // YQmBKgAAAAAAAjANBgkqhkiG9w0BAQsFADCBiDELMAkG
// SIG // A1UEBhMCVVMxEzARBgNVBAgTCldhc2hpbmd0b24xEDAO
// SIG // BgNVBAcTB1JlZG1vbmQxHjAcBgNVBAoTFU1pY3Jvc29m
// SIG // dCBDb3Jwb3JhdGlvbjEyMDAGA1UEAxMpTWljcm9zb2Z0
// SIG // IFJvb3QgQ2VydGlmaWNhdGUgQXV0aG9yaXR5IDIwMTAw
// SIG // HhcNMTAwNzAxMjEzNjU1WhcNMjUwNzAxMjE0NjU1WjB8
// SIG // MQswCQYDVQQGEwJVUzETMBEGA1UECBMKV2FzaGluZ3Rv
// SIG // bjEQMA4GA1UEBxMHUmVkbW9uZDEeMBwGA1UEChMVTWlj
// SIG // cm9zb2Z0IENvcnBvcmF0aW9uMSYwJAYDVQQDEx1NaWNy
// SIG // b3NvZnQgVGltZS1TdGFtcCBQQ0EgMjAxMDCCASIwDQYJ
// SIG // KoZIhvcNAQEBBQADggEPADCCAQoCggEBAKkdDbx3EYo6
// SIG // IOz8E5f1+n9plGt0VBDVpQoAgoX77XxoSyxfxcPlYcJ2
// SIG // tz5mK1vwFVMnBDEfQRsalR3OCROOfGEwWbEwRA/xYIiE
// SIG // VEMM1024OAizQt2TrNZzMFcmgqNFDdDq9UeBzb8kYDJY
// SIG // YEbyWEeGMoQedGFnkV+BVLHPk0ySwcSmXdFhE24oxhr5
// SIG // hoC732H8RsEnHSRnEnIaIYqvS2SJUGKxXf13Hz3wV3Ws
// SIG // vYpCTUBR0Q+cBj5nf/VmwAOWRH7v0Ev9buWayrGo8noq
// SIG // CjHw2k4GkbaICDXoeByw6ZnNPOcvRLqn9NxkvaQBwSAJ
// SIG // k3jN/LzAyURdXhacAQVPIk0CAwEAAaOCAeYwggHiMBAG
// SIG // CSsGAQQBgjcVAQQDAgEAMB0GA1UdDgQWBBTVYzpcijGQ
// SIG // 80N7fEYbxTNoWoVtVTAZBgkrBgEEAYI3FAIEDB4KAFMA
// SIG // dQBiAEMAQTALBgNVHQ8EBAMCAYYwDwYDVR0TAQH/BAUw
// SIG // AwEB/zAfBgNVHSMEGDAWgBTV9lbLj+iiXGJo0T2UkFvX
// SIG // zpoYxDBWBgNVHR8ETzBNMEugSaBHhkVodHRwOi8vY3Js
// SIG // Lm1pY3Jvc29mdC5jb20vcGtpL2NybC9wcm9kdWN0cy9N
// SIG // aWNSb29DZXJBdXRfMjAxMC0wNi0yMy5jcmwwWgYIKwYB
// SIG // BQUHAQEETjBMMEoGCCsGAQUFBzAChj5odHRwOi8vd3d3
// SIG // Lm1pY3Jvc29mdC5jb20vcGtpL2NlcnRzL01pY1Jvb0Nl
// SIG // ckF1dF8yMDEwLTA2LTIzLmNydDCBoAYDVR0gAQH/BIGV
// SIG // MIGSMIGPBgkrBgEEAYI3LgMwgYEwPQYIKwYBBQUHAgEW
// SIG // MWh0dHA6Ly93d3cubWljcm9zb2Z0LmNvbS9QS0kvZG9j
// SIG // cy9DUFMvZGVmYXVsdC5odG0wQAYIKwYBBQUHAgIwNB4y
// SIG // IB0ATABlAGcAYQBsAF8AUABvAGwAaQBjAHkAXwBTAHQA
// SIG // YQB0AGUAbQBlAG4AdAAuIB0wDQYJKoZIhvcNAQELBQAD
// SIG // ggIBAAfmiFEN4sbgmD+BcQM9naOhIW+z66bM9TG+zwXi
// SIG // qf76V20ZMLPCxWbJat/15/B4vceoniXj+bzta1RXCCtR
// SIG // gkQS+7lTjMz0YBKKdsxAQEGb3FwX/1z5Xhc1mCRWS3Tv
// SIG // QhDIr79/xn/yN31aPxzymXlKkVIArzgPF/UveYFl2am1
// SIG // a+THzvbKegBvSzBEJCI8z+0DpZaPWSm8tv0E4XCfMkon
// SIG // /VWvL/625Y4zu2JfmttXQOnxzplmkIz/amJ/3cVKC5Em
// SIG // 4jnsGUpxY517IW3DnKOiPPp/fZZqkHimbdLhnPkd/DjY
// SIG // lPTGpQqWhqS9nhquBEKDuLWAmyI4ILUl5WTs9/S/fmNZ
// SIG // JQ96LjlXdqJxqgaKD4kWumGnEcua2A5HmoDF0M2n0O99
// SIG // g/DhO3EJ3110mCIIYdqwUB5vvfHhAN/nMQekkzr3ZUd4
// SIG // 6PioSKv33nJ+YWtvd6mBy6cJrDm77MbL2IK0cs0d9LiF
// SIG // AR6A+xuJKlQ5slvayA1VmXqHczsI5pgt6o3gMy4SKfXA
// SIG // L1QnIffIrE7aKLixqduWsqdCosnPGUFN4Ib5KpqjEWYw
// SIG // 07t0MkvfY3v1mYovG8chr1m1rtxEPJdQcdeh0sVV42ne
// SIG // V8HR3jDA/czmTfsNv11P6Z0eGTgvvM9YBS7vDaBQNdrv
// SIG // CScc1bN+NR4Iuto229Nfj950iEkSoYIDeTCCAmECAQEw
// SIG // geOhgbmkgbYwgbMxCzAJBgNVBAYTAlVTMRMwEQYDVQQI
// SIG // EwpXYXNoaW5ndG9uMRAwDgYDVQQHEwdSZWRtb25kMR4w
// SIG // HAYDVQQKExVNaWNyb3NvZnQgQ29ycG9yYXRpb24xDTAL
// SIG // BgNVBAsTBE1PUFIxJzAlBgNVBAsTHm5DaXBoZXIgRFNF
// SIG // IEVTTjo5OEZELUM2MUUtRTY0MTElMCMGA1UEAxMcTWlj
// SIG // cm9zb2Z0IFRpbWUtU3RhbXAgU2VydmljZaIlCgEBMAkG
// SIG // BSsOAwIaBQADFQAYDayzjGgws/h0GbJ4zoArNS8I+qCB
// SIG // wjCBv6SBvDCBuTELMAkGA1UEBhMCVVMxEzARBgNVBAgT
// SIG // Cldhc2hpbmd0b24xEDAOBgNVBAcTB1JlZG1vbmQxHjAc
// SIG // BgNVBAoTFU1pY3Jvc29mdCBDb3Jwb3JhdGlvbjENMAsG
// SIG // A1UECxMETU9QUjEnMCUGA1UECxMebkNpcGhlciBOVFMg
// SIG // RVNOOjRERTktMEM1RS0zRTA5MSswKQYDVQQDEyJNaWNy
// SIG // b3NvZnQgVGltZSBTb3VyY2UgTWFzdGVyIENsb2NrMA0G
// SIG // CSqGSIb3DQEBBQUAAgUA3qgyzDAiGA8yMDE4MDUxODAw
// SIG // NTY0NFoYDzIwMTgwNTE5MDA1NjQ0WjB3MD0GCisGAQQB
// SIG // hFkKBAExLzAtMAoCBQDeqDLMAgEAMAoCAQACAgF0AgH/
// SIG // MAcCAQACAhcYMAoCBQDeqYRMAgEAMDYGCisGAQQBhFkK
// SIG // BAIxKDAmMAwGCisGAQQBhFkKAwGgCjAIAgEAAgMW42Ch
// SIG // CjAIAgEAAgMHoSAwDQYJKoZIhvcNAQEFBQADggEBAFEU
// SIG // TnkxIzKzKWyG/F7KM9SrXR7f+XMh59Ece6mvAJYkXPUr
// SIG // vPW5DpHhfgcHAAfmQ+5bLT1omq/D1/2CcXo2Y7vkt5i5
// SIG // uR3hvwFM6OYSME2tlCX7iX5Eze0UBltizuGclaiAvMr4
// SIG // kfvTXWwv1OOmEt9ZMUhKKvAwspDeV1JE5LOuCityXKqG
// SIG // xeB39X2lj8mP23GMoWveyd/fpFJz4Put42dEvI0NELpk
// SIG // gatA0lTEBdDb9iHdPFxQH60Sw9yDCSF+h9wy3/ejC1ap
// SIG // dxA2VUbr8jgamgRXNh1BFloejW5jW+KuLB31KK8yUk1E
// SIG // RfVv14ypOcPBPxby68Jbb0syRw/lQCkxggMNMIIDCQIB
// SIG // ATCBkzB8MQswCQYDVQQGEwJVUzETMBEGA1UECBMKV2Fz
// SIG // aGluZ3RvbjEQMA4GA1UEBxMHUmVkbW9uZDEeMBwGA1UE
// SIG // ChMVTWljcm9zb2Z0IENvcnBvcmF0aW9uMSYwJAYDVQQD
// SIG // Ex1NaWNyb3NvZnQgVGltZS1TdGFtcCBQQ0EgMjAxMAIT
// SIG // MwAAAJ0gnFZ3VdQomgAAAAAAnTANBglghkgBZQMEAgEF
// SIG // AKCCAUowGgYJKoZIhvcNAQkDMQ0GCyqGSIb3DQEJEAEE
// SIG // MC8GCSqGSIb3DQEJBDEiBCDgZ+Cl7Kr5p7WQrtkl1aCC
// SIG // +dElRWqZKR321TPTle7b0DCB+gYLKoZIhvcNAQkQAi8x
// SIG // geowgecwgeQwgb0EII75P1eVP2+Az/vlZDg3u0dJz7xM
// SIG // ZW9w4vFYJ32kJqkcMIGYMIGApH4wfDELMAkGA1UEBhMC
// SIG // VVMxEzARBgNVBAgTCldhc2hpbmd0b24xEDAOBgNVBAcT
// SIG // B1JlZG1vbmQxHjAcBgNVBAoTFU1pY3Jvc29mdCBDb3Jw
// SIG // b3JhdGlvbjEmMCQGA1UEAxMdTWljcm9zb2Z0IFRpbWUt
// SIG // U3RhbXAgUENBIDIwMTACEzMAAACdIJxWd1XUKJoAAAAA
// SIG // AJ0wIgQgHKj5QoD4rxJiHS58dTt+qgzhwzioOl4k9rjO
// SIG // NzqCqmcwDQYJKoZIhvcNAQELBQAEggEAtpq2mpCQ9rms
// SIG // Xh6pDoeC8KMhk0XCVUXad1NJ6wi+rQXvTsal5ONv1nF9
// SIG // kiyhIjyakhSWqgphgSDjI/s2nQ2DlQUTDQEdZKDlvSd7
// SIG // PAkHcbYFTLQHAYYR/I7AE3OzhnIsPjkqku1VlKxV68b+
// SIG // WS0VzrQLaLmU90WH5TOW8pnH2kZGSbuyL+bzwiMjKGgH
// SIG // YgOJpEZy3VhF+eJb9DSDs+Z5vyt+L14LHKlq3HAeAhkM
// SIG // 0BY4bcZ5gSkBF/pzP40V3HjynHb0sVNhefiHVGx0K8Gz
// SIG // 34dc/ypCyeYNVqOMtKgz9k/6eNhMuDQ82dTAQDJ33jo0
// SIG // Z7egyPFEu+bZKOAyX1pUWg==
// SIG // End signature block
