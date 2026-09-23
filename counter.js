const mongoose = require('mongoose');

let fallbackCount = 450;
let connected = false;

const counterSchema = new mongoose.Schema({
    _id: String,
    count: { type: Number, default: 450 }
});
const Counter = mongoose.model('Counter', counterSchema);

async function connect() {
    if (!process.env.MONGODB_URI) {
        console.log('No MONGODB_URI — session count runs in memory only');
        return;
    }
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        connected = true;
        console.log('MongoDB connected — session counter active');
    } catch (e) {
        console.log('MongoDB failed, using in-memory counter:', e.message);
    }
}


async function getCount() {
    if (!connected) return fallbackCount;
    try {
        const doc = await Counter.findOneAndUpdate(
            { _id: 'sessions' },
            { $setOnInsert: { count: 0 } },
            { upsert: true, new: true }
        );
        return doc.count;
    } catch {
        return fallbackCount;
    }
}

async function increment() {
    if (!connected) {
        fallbackCount++;
        return fallbackCount;
    }
    try {
        const doc = await Counter.findOneAndUpdate(
            { _id: 'sessions' },
            { $inc: { count: 1 } },
            { upsert: true, new: true }
        );
        return doc.count;
    } catch {
        fallbackCount++;
        return fallbackCount;
    }
}

connect();

module.exports = { getCount, increment };
