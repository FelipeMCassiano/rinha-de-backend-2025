import { Queue } from "bullmq";
import IORedis from "ioredis";
import { Payment } from "./models";

const QUEUE_KEY = "payments";
const CORR_SET = "set:correlations";

const connection = new IORedis(process.env.REDIS_URL!);

const queue = new Queue(QUEUE_KEY, { connection });

export const enqueuePayment = async (payment: Payment) => {
    await queue.add("payment", payment);
};
