import Redis from "ioredis";
import { Payment, Summary } from "./models";

export const redis = new Redis(process.env.REDIS_URL!);

export const processSummary = async (from?: string, to?: string) => {
    const [defaultSummary, fallbackSummary] = await Promise.all([
        getSummary("default", from, to),
        getSummary("fallback", from, to),
    ]);

    return {
        ...defaultSummary,
        ...fallbackSummary,
    };
};

const getSummary = async (
    processor: "default" | "fallback",
    from?: string,
    to?: string
): Promise<Summary> => {
    const key = "payments: " + processor;

    const min = from ? new Date(from).getTime() : "+inf";
    const max = to ? new Date(to).getTime() : "-inf";

    const results = await redis.zrangebyscore(key, min, max);

    let totalAmount = 0;

    const payments = results.map((p) => {
        const payment: Payment = JSON.parse(p);

        totalAmount += payment.amount;

        return payment;
    });

    const summary: Summary = {
        [processor]: {
            totalRequests: payments.length,
            totalAmount: totalAmount,
        },
    };

    return summary;
};
