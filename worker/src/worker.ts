import { Worker } from "bullmq";
import IORedis from "ioredis";
import { QUEUE_KEY } from "./internal/configs";
import { processPayment } from "./internal/payment-processor";
import { Payment } from "./models/payment";

const connection = new IORedis(process.env.REDIS_URL!, {
    maxRetriesPerRequest: null,
});

const worker = new Worker(
    QUEUE_KEY,
    async (job) => {
        console.log("worker logs");

        const payment: Payment = job.data;
        payment.requestedAt = new Date().toISOString();

        console.log(payment);

        await processPayment(payment);
    },
    { connection }
);
