"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = handler;
let cachedHandler = null;
async function handler(req, res) {
    try {
        if (!cachedHandler) {
            const { createApp } = require('./main');
            const app = await createApp();
            await app.init();
            cachedHandler = app.getHttpAdapter().getInstance();
        }
        const handlerFn = cachedHandler;
        if (!handlerFn) {
            throw new Error('Handler initialization failed.');
        }
        handlerFn(req, res);
    }
    catch (error) {
        res.status(500).json({
            error: error.message,
            stack: error.stack,
            code: error.code || 'UNKNOWN',
        });
    }
}
//# sourceMappingURL=index.js.map