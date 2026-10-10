import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

// Ensure uploads directory exists
const UPLOADS_DIR = path.resolve(__dirname, 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Enable CORS and JSON parsing
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Range, Authorization');
  if (req.method === 'OPTIONS') {
    res.sendStatus(204);
    return;
  }
  next();
});

app.use(express.json({ limit: '120mb' }));
app.use(express.urlencoded({ extended: true, limit: '120mb' }));

// Multer storage engine
const storageEngine = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    const queryFilename = typeof req.query?.filename === 'string' ? req.query.filename : '';
    const queryPostId = typeof req.query?.postId === 'string' ? req.query.postId : '';
    const headerFilename = typeof req.headers['x-filename'] === 'string' ? req.headers['x-filename'] : '';
    const headerPostId = typeof req.headers['x-post-id'] === 'string' ? req.headers['x-post-id'] : '';
    const bodyFilename = req.body && typeof req.body.filename === 'string' ? req.body.filename : '';
    const bodyPostId = req.body && typeof (req.body.id || req.body.postId) === 'string' ? (req.body.id || req.body.postId) : '';

    const rawName = queryFilename || headerFilename || bodyFilename || file.originalname || '';
    const cleanBase = path.basename(rawName).replace(/[^a-zA-Z0-9_\-\.]/g, '_');
    const ext = path.extname(cleanBase).toLowerCase() || (file.mimetype.includes('video') ? (file.mimetype.includes('webm') ? '.webm' : '.mp4') : '.jpg');
    
    const specifiedId = queryPostId || headerPostId || bodyPostId;

    if (specifiedId) {
      const cleanId = String(specifiedId).replace(/[^a-zA-Z0-9_\-]/g, '_');
      cb(null, `${cleanId}${ext}`);
    } else if (cleanBase && cleanBase.length > 4 && cleanBase.includes('.')) {
      cb(null, cleanBase);
    } else {
      const safeName = `${file.fieldname}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}${ext}`;
      cb(null, safeName);
    }
  },
});

const upload = multer({
  storage: storageEngine,
  limits: {
    fileSize: 105 * 1024 * 1024, // 105 MB max to support up to 100MB videos
  },
});

// API endpoint to upload media permanently
app.post('/api/media/upload', upload.single('media'), (req, res) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No media file uploaded' });
      return;
    }

    const host = req.get('host') || `localhost:${PORT}`;
    const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'http';
    const relativeUrl = `/api/media/${req.file.filename}`;
    const absoluteUrl = `${protocol}://${host}${relativeUrl}`;

    res.json({
      success: true,
      filename: req.file.filename,
      relativeUrl,
      url: absoluteUrl,
      size: req.file.size,
      mimetype: req.file.mimetype,
    });
  } catch (err: any) {
    console.error('[Server] Upload error:', err);
    res.status(500).json({ error: err?.message || 'Failed to upload media' });
  }
});

// API endpoint to stream media with full HTTP 206 Byte Range support (critical for mobile Safari & Chrome)
app.get('/api/media/:filename', (req, res) => {
  try {
    const rawFilename = path.basename(req.params.filename);
    let filePath = path.resolve(UPLOADS_DIR, rawFilename);

    // If exact file does not exist, look for any matching file in uploads directory by base ID
    if (!fs.existsSync(filePath)) {
      const baseNameWithoutExt = rawFilename.replace(/\.[^/.]+$/, '');
      const cleanId = baseNameWithoutExt.replace(/^reel-/, '').replace(/^post-/, '');
      try {
        const files = fs.readdirSync(UPLOADS_DIR);
        const match = files.find((f) => {
          const fClean = f.replace(/\.[^/.]+$/, '');
          return (
            f === rawFilename ||
            fClean === baseNameWithoutExt ||
            fClean.includes(baseNameWithoutExt) ||
            (cleanId.length > 3 && fClean.includes(cleanId))
          );
        });
        if (match) {
          filePath = path.resolve(UPLOADS_DIR, match);
        }
      } catch {}
    }

    if (!fs.existsSync(filePath)) {
      res.status(404).send('Media not found');
      return;
    }

    const stat = fs.statSync(filePath);
    const fileSize = stat.size;
    const range = req.headers.range;

    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes: Record<string, string> = {
      '.mp4': 'video/mp4',
      '.webm': 'video/webm',
      '.mov': 'video/quicktime',
      '.m4v': 'video/mp4',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.webp': 'image/webp',
    };
    const contentType = mimeTypes[ext] || 'application/octet-stream';

    // Handle range request for smooth, seekable video streaming
    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

      if (start >= fileSize) {
        res.status(416).send(`Requested range not satisfiable\n${start} >= ${fileSize}`);
        return;
      }

      const chunksize = end - start + 1;
      const file = fs.createReadStream(filePath, { start, end });
      const head = {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Access-Control-Allow-Origin': '*',
      };

      res.writeHead(206, head);
      file.pipe(res);
    } else {
      const head = {
        'Content-Length': fileSize,
        'Content-Type': contentType,
        'Accept-Ranges': 'bytes',
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Access-Control-Allow-Origin': '*',
      };
      res.writeHead(200, head);
      fs.createReadStream(filePath).pipe(res);
    }
  } catch (err: any) {
    console.error('[Server] Streaming error:', err);
    res.status(500).send('Streaming error');
  }
});

// Service Worker Route with Service-Worker-Allowed and no-cache headers
app.get('/sw.js', (_req, res) => {
  const publicSw = path.resolve(__dirname, 'public', 'sw.js');
  const distSw = path.resolve(__dirname, 'dist', 'sw.js');
  const swPath = fs.existsSync(publicSw) ? publicSw : (fs.existsSync(distSw) ? distSw : '');

  if (swPath) {
    res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
    res.setHeader('Service-Worker-Allowed', '/');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.sendFile(swPath);
  } else {
    res.status(404).send('Service worker not found');
  }
});

// Web Manifest Route with proper MIME type
app.get(['/manifest.json', '/manifest.webmanifest'], (req, res) => {
  const filename = req.path.includes('webmanifest') ? 'manifest.webmanifest' : 'manifest.json';
  const publicManifest = path.resolve(__dirname, 'public', filename);
  const distManifest = path.resolve(__dirname, 'dist', filename);
  const manifestPath = fs.existsSync(publicManifest) ? publicManifest : (fs.existsSync(distManifest) ? distManifest : '');

  if (manifestPath) {
    res.setHeader('Content-Type', 'application/manifest+json; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.sendFile(manifestPath);
  } else {
    res.status(404).send('Manifest not found');
  }
});

// Serve public directory directly for static assets (logo, favicon, icons, etc.)
app.use(express.static(path.resolve(__dirname, 'public'), {
  maxAge: '1h',
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.ico') || filePath.endsWith('.png') || filePath.endsWith('.svg')) {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Cache-Control', 'public, max-age=3600');
    }
  },
}));

// Mount Vite or serve static dist in production
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get('*', (_req, res) => {
        res.sendFile(path.resolve(distPath, 'index.html'));
      });
    }
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Server] Jhalak Reels server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
