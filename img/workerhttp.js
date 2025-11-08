//workerhttp.js
const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');
const https = require('https'); // <---- IMPORTANTE!

const app = express();
const PORT = 3000;

// Path ai certificati SSL
const SSL_KEY_PATH = './key.pem';
const SSL_CERT_PATH = './cert.pem';

// Abilita CORS per permettere richieste dalla tua app React
app.use(cors());
app.use(express.json());

// Crea la cartella uploads se non esiste
const uploadDir = 'uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Configurazione Multer per il salvataggio dei file
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const timestamp = Date.now();
    const cameraType = file.fieldname; // 'front' o 'back'
    cb(null, `${timestamp}_${cameraType}_camera.jpg`);
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // Limite 10MB per file
  }
});

// Endpoint per ricevere le immagini
app.post('/upload', upload.fields([
  { name: 'front', maxCount: 1 },
  { name: 'back', maxCount: 1 }
]), (req, res) => {
  try {
    if (!req.files) {
      return res.status(400).json({ 
        success: false, 
        message: 'Nessun file ricevuto' 
      });
    }

    const frontCamera = req.files['front'] ? req.files['front'][0] : null;
    const backCamera = req.files['back'] ? req.files['back'][0] : null;

    // ATTENZIONE: protocol ora è sempre 'https'
    const host = req.headers.host || `localhost:${PORT}`;
    const protocol = 'http';
    const outputFilename = `${Date.now()}_deep.jpg`;

    const frontUrl = frontCamera 
      ? `${protocol}://${host}/uploads/${frontCamera.filename}` 
      : null;
    const backUrl = backCamera 
      ? `${protocol}://${host}/uploads/${backCamera.filename}` 
      : null;
    const outputUrl =  
      `${protocol}://${host}/api/uploads/${outputFilename}`;

    const localUploadDir = '/home/ubuntu/Deep-Live-Cam/worker/uploads';
    const shellCommand = `sudo /home/ubuntu/Deep-Live-Cam/startBatch.sh "${frontCamera ? path.join(localUploadDir, frontCamera.filename) : ''}" "${backCamera ? path.join(localUploadDir, backCamera.filename) : ''}" "${path.join(localUploadDir, outputFilename)}"`;
    console.log('✅ Eseguo comando:', shellCommand);
    let shellResult = '';
    try {
      shellResult = execSync(shellCommand, { encoding: 'utf-8' });
      console.log('📥 Risultato comando:', shellResult);
    } catch (shellError) {
      console.error('❌ Errore esecuzione shell:', shellError);
      return res.status(500).json({
        success: false,
        message: 'Errore durante esecuzione comando shell',
        error: shellError.message
      });
    }

    res.json({ 
      success: true,
      message: 'Immagini caricate con successo',
      frontUrl,
      backUrl,
      outputUrl
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Errore del server',
      error: error.message 
    });
  }
});

// Endpoint home di test
app.get('/', (req, res) => {
  res.json({ 
    message: 'Server dual camera attivo',
    endpoint: '/upload'
  });
});

// Endpoint per visualizzare le immagini caricate
app.get('/uploads/:filename', (req, res) => {
  const filename = req.params.filename;
  const filepath = path.join(__dirname, uploadDir, filename);
  if (fs.existsSync(filepath)) {
    res.sendFile(filepath);
  } else {
    res.status(404).send('File non trovato');
  }
});

// LEGGE I CERTIFICATI
const httpsOptions = {
  key: fs.readFileSync(SSL_KEY_PATH),
  cert: fs.readFileSync(SSL_CERT_PATH)
};

// AVVIA IL SERVER HTTP
app.listen(PORT, () => {
  console.log(`🚀 Server HTTP avviato su http://localhost:${PORT}`);
  console.log(`📁 Le immagini verranno salvate in ./${uploadDir}`);
});
