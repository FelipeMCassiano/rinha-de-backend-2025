import { Worker } from "bullmq";
import IORedis from "ioredis";
import { QUEUE_KEY } from "./internal/configs";
import { Payment } from "./internal/models";
import {
    existCorrelation,
    processPayment,
    registerCorrelation,
} from "./internal/payment-processor";

const connection = new IORedis(process.env.REDIS_URL!, {
    maxRetriesPerRequest: null,
});

const worker = new Worker(
    QUEUE_KEY,
    async (job) => {
        const payment: Payment = job.data;

        const correlationId = payment.correlationId;

        const exists = await existCorrelation(correlationId);

        if (exists) return;

        payment.requestedAt = new Date().toISOString();

        await processPayment(payment);

        await registerCorrelation(correlationId);
    },
    { connection }
);
