import Redis from "ioredis";
import { queue } from "./configs";
import { Payment } from "./models";

const redis = new Redis(process.env.REDIS_URL!);

const PROCESSOR_DEFAULT = process.env.PROCESSOR_DEFAULT!;
const PROCESSOR_FALLBACK = process.env.PROCESSOR_FALLBACK!;

const CORR_SET = "set:correlations";

export const processPayment = async (payment: Payment) => {
    let resp = await sendToProcessor(PROCESSOR_DEFAULT, payment);
    if (resp.status === 200) {
        await savePayment("default", payment);
        return;
    }

    resp = await sendToProcessor(PROCESSOR_FALLBACK, payment);
    if (resp.status === 200) {
        await savePayment("fallback", payment);
        return;
    }

    await queue.add("payment", payment);
};

const sendToProcessor = async (
    url: string,
    payment: Payment
): Promise<Response> => {
    const resp = await fetch(`${url}/payments`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(payment),
    });

    return resp;
};

const savePayment = async (
    processor: "default" | "fallback",
    payment: Payment
) => {
    const key = "payments: " + processor;
    const score = new Date(payment.requestedAt!).getTime();
    await redis.zadd(key, score, JSON.stringify(payment));
};
export const registerCorrelation = async (correlationId: string) => {
    await redis.sadd(CORR_SET, correlationId);
};

export const existCorrelation = async (correlationId: string) => {
    return await redis.sismember(CORR_SET, correlationId);
};
