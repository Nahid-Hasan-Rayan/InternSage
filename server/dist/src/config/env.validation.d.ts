import 'reflect-metadata';
declare enum NodeEnv {
    Development = "development",
    Production = "production",
    Test = "test"
}
declare class EnvironmentVariables {
    NODE_ENV: NodeEnv;
    PORT: number;
    DATABASE_URL: string;
    DIRECT_URL?: string;
    JWT_SECRET: string;
    JWT_EXPIRES_IN: string;
    CORS_ORIGINS: string;
    METRICS_TOKEN?: string;
    JOB_RSS_FEED_URLS?: string;
    JOB_SCRAPER_ENABLED?: string;
    CRON_SECRET?: string;
    OPENROUTER_API_KEY?: string;
    OPENROUTER_MODEL?: string;
    PUBLIC_APP_URL?: string;
}
export declare function validateEnv(config: Record<string, unknown>): EnvironmentVariables;
export {};
