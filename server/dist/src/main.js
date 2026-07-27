"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createApp = createApp;
require("reflect-metadata");
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const helmet_1 = __importDefault(require("helmet"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const app_module_1 = require("./app.module");
async function createApp() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule, {
        logger: ['error', 'warn', 'log'],
    });
    app.use((0, helmet_1.default)());
    app.use((0, cookie_parser_1.default)());
    const allowedOrigins = (process.env.CORS_ORIGINS ?? '')
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean);
    app.enableCors({
        origin: allowedOrigins.length > 0 ? allowedOrigins : false,
        credentials: true,
    });
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
    }));
    return app;
}
async function bootstrap() {
    const logger = new common_1.Logger('Bootstrap');
    const app = await createApp();
    const port = Number(process.env.PORT ?? 3000);
    await app.listen(port);
    logger.log(`InternSage API listening on port ${port} (${process.env.NODE_ENV ?? 'development'})`);
}
if (require.main === module) {
    bootstrap().catch((error) => {
        console.error('Fatal startup error:', error.message);
        process.exit(1);
    });
}
//# sourceMappingURL=main.js.map