import { Queue } from "bullmq";
import IORedis from "ioredis";

export const QUEUE_KEY = "payments";

export const connection = new IORedis(process.env.REDIS_URL!, {
    maxRetriesPerRequest: null,
});

export const queue = new Queue("payments", { connection });
