const express = require('express');
const app = express();
__path = process.cwd();
const bodyParser = require('body-parser');
const port = process.env.PORT || 8000;
const { getCount } = require('./counter');

let server = require('./qr'),
    code = require('./pair');

require('events').EventEmitter.defaultMaxListeners = 500;

app.use(express.static(__path, { etag: false, lastModified: false, setHeaders: (res) => res.setHeader('Cache-Control', 'no-store') }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Stats endpoint
app.get('/api/stats', async (req, res) => {
    try {
        const count = await getCount();
        res.json({ sessions: count });
    } catch {
        res.json({ sessions: 3000 });
    }
});

// QR image router (serves raw QR image at /qr/generate)
app.use('/qr', server);

// Pair code router
app.use('/code', code);

// Pages
app.get('/pair', async (req, res) => {
    res.sendFile(__path + '/pair.html');
});

app.get('/qr-page', async (req, res) => {
    res.sendFile(__path + '/qr.html');
});

app.get('/', async (req, res) => {
    res.sendFile(__path + '/main.html');
});

app.listen(port, () => {
    console.log(`📡 Connected on http://localhost:` + port);
});

module.exports = app;
