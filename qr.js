const { makeid } = require('./id');
const { increment } = require('./counter');
const QRCode = require('qrcode');
const express = require('express');
const fs = require('fs');
const pino = require('pino');
const {
    default: makeWASocket,
    useMultiFileAuthState,
    Browsers,
    delay,
    makeCacheableSignalKeyStore,
    fetchLatestBaileysVersion,
    DisconnectReason,
    jidNormalizedUser,
} = require("@whiskeysockets/baileys");

let router = express.Router();

function removeFile(FilePath) {
    if (!fs.existsSync(FilePath)) return false;
    fs.rmSync(FilePath, { recursive: true, force: true });
}

router.get('/generate', async (req, res) => {
    const id = makeid();

    async function DaveTech() {
        const { state, saveCreds } = await useMultiFileAuthState('./temp/' + id);
        try {
            const { version } = await fetchLatestBaileysVersion();
            const logger = pino({ level: 'silent' });

            let client = makeWASocket({
                version,
                auth: {
                    creds: state.creds,
                    keys: makeCacheableSignalKeyStore(state.keys, logger),
                },
                printQRInTerminal: false,
                logger,
                browser: Browsers.macOS('Safari'),
                connectTimeoutMs: 60000,
                keepAliveIntervalMs: 10000,
            });

            client.ev.on('creds.update', saveCreds);

            let sessionSent = false;

            client.ev.on('connection.update', async (s) => {
                const { connection, lastDisconnect, qr } = s;

                if (qr && !res.headersSent) {
                    await res.end(await QRCode.toBuffer(qr));
                }

                if (connection === 'open') {
                    if (sessionSent) return;
                    sessionSent = true;
                    try {
                        const jid = jidNormalizedUser(client.user.id);
                        await delay(2000);
                        let b64data = Buffer.from(JSON.stringify(state.creds)).toString('base64');
                        let session = await client.sendMessage(jid, { 
                            text: 'Yeoboe-xmd:~' + b64data 
                        });
                        await client.sendMessage(jid, {
                            text: "✅ Yeoboe-xmd x Session Linked Successfully!\n\nYour bot is now connected to WhatsApp. No one can access your account or messages using this session — it only allows your bot to operate.\n\nCopy the session ID above and paste it into the SESSION field when deploying your bot.\n\nSupport: https://wa.me/message/255742579250\n\n— Yeoboe-xmd Tech"
                        }, { quoted: session });
                        await increment();
                        await delay(500);
                        await client.ws.close();
                        removeFile('./temp/' + id);
                    } catch (e) {
                        console.log('Error sending session messages:', e);
                    }
                } else if (connection === 'close') {
                    if (sessionSent) return;
                    const code = lastDisconnect?.error?.output?.statusCode;
                    if (code !== DisconnectReason.loggedOut) {
                        await delay(5000);
                        DaveTech();
                    }
                }
            });

        } catch (err) {
            console.log('QR service error:', err);
            if (!res.headersSent) {
                await res.json({ code: 'Service is Currently Unavailable' });
            }
            removeFile('./temp/' + id);
        }
    }

    return await DaveTech();
});

module.exports = router;