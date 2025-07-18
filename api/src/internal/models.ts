export type Payment = {
    correlationId: string;
    amount: number;
    requestedAt?: string;
};

export type Summary = {
    [key: string]: {
        totalRequests: number;
        totalAmount: number;
    };
};
