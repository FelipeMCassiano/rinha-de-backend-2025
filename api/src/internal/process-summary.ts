import Redis from "ioredis";
import { Payment, Summary } from "./models";

const redis = new Redis(process.env.REDIS_URL!);

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

    const results = await redis.lrange(key, 0, -1);
    const payments = results
        .map((p) => {
            const payment: Payment = JSON.parse(p);

            return payment;
        })
        .filter((p) => {
            const paymentDate = Date.parse(p.requestedAt!);

            return (
                (!from || paymentDate >= new Date(from).getTime()) &&
                (!to || paymentDate <= new Date(to).getTime())
            );
        });

    const summary: Summary = {
        [processor]: {
            totalRequests: payments.length,
            totalAmount: payments.reduce((acc, i) => acc + i.amount, 0),
        },
    };

    return summary;
};
