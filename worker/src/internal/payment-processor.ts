import Redis from "ioredis";
import { Payment } from "../models/payment";
import { queue } from "./configs";

const redis = new Redis(process.env.REDIS_URL!);

const PROCESSOR_DEFAULT = process.env.PROCESSOR_DEFAULT!;
const PROCESSOR_FALLBACK = process.env.PROCESSOR_FALLBACK!;

const savePayment = async (
    processor: "default" | "fallback",
    payment: Payment
) => {
    const key = "payments: " + processor;
    await redis.lpush(key, JSON.stringify(payment));
};

export const processPayment = async (payment: Payment) => {
    console.log("default " + PROCESSOR_DEFAULT);
    console.log("fallback " + PROCESSOR_FALLBACK);

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
    console.log(resp);

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
