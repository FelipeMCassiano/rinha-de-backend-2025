import fastify from "fastify";
import { Payment } from "./internal/models";
import { processSummary } from "./internal/process-summary";
import { enqueuePayment } from "./internal/queue";

const server = fastify();

const APP_PORT = parseInt(process.env.APP_PORT!);

server.post<{ Body: Payment }>("/payments", async (request, reply) => {
    const body = request.body;

    await enqueuePayment(body);
});

server.get<{ Querystring: { from?: string; to?: string } }>(
    "/payments-summary",
    {},
    async (request, reply) => {
        const from = request.query.from;
        const to = request.query.to;

        const result = await processSummary(from, to);

        return reply.code(200).send(result);
    }
);

server.listen({ port: APP_PORT, host: "0.0.0.0" }, (err, address) => {
    if (err) {
        console.error(err);
        return;
    }

    console.log(`Server listening at ${address}`);
});
