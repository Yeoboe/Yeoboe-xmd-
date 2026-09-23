const { makeid } = require('./id');
const { increment } = require('./counter');
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

const router = express.Router();

function removeFile(filePath) {
    if (!fs.existsSync(filePath)) return false;
    fs.rmSync(filePath, { recursive: true, force: true });
}

router.get('/', async (req, res) => {
    const id = makeid();
    let num = req.query.number;

    async function DaveTech() {
        const { state, saveCreds } = await useMultiFileAuthState('./temp/' + id);
        try {
            const { version } = await fetchLatestBaileysVersion();
            const logger = pino({ level: 'silent' });

            const client = makeWASocket({
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
                const { connection, lastDisconnect } = s;

                if (connection === 'open') {
                    if (sessionSent) return;
                    sessionSent = true;
                    try {
                        const jid = jidNormalizedUser(client.user.id);
                        await delay(2000);
                        const b64data = Buffer.from(JSON.stringify(state.creds)).toString('base64');
                        const session = await client.sendMessage(jid, { 
                            text: 'Yeoboe-xmd:~' + b64data 
                        });
                        await client.sendMessage(jid, {
                            text: "✅ Yeoboe-xmd x Session Linked Successfully!\n\nYour bot is now connected to WhatsApp. No one can access your account or messages using this session — it only allows your bot to operate.\n\nCopy the session ID above and paste it into the SESSION field when deploying your bot.\n\nSupport: https://wa.me/message/255742579250\n\n— Yeoboe-xmd Tech"
                        }, { quoted: session });
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

            if (!client.authState.creds.registered) {
                await delay(1500);
                num = num.replace(/[^0-9]/g, '');
                const code = await client.requestPairingCode(num);
                await increment();
                if (!res.headersSent) {
                    await res.send({ code });
                }
            }

        } catch (err) {
            console.log('Pair service error:', err);
            removeFile('./temp/' + id);
            if (!res.headersSent) {
                await res.send({ code: 'Service Currently Unavailable' });
            }
        }
    }

    await DaveTech();
});

module.exports = router;