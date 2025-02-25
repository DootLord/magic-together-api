interface RateLimit {
    count: number;
    lastReset: number;
}

export class RateLimiter {
    private limits: Map<string, RateLimit>;
    private requestsPerWindow: number;
    private windowMs: number;

    constructor(requestsPerWindow: number, windowMs: number) {
        this.limits = new Map();
        this.requestsPerWindow = requestsPerWindow;
        this.windowMs = windowMs;
    }

    tryRequest(clientId: string): boolean {
        const now = Date.now();
        const clientLimit = this.limits.get(clientId) || { count: 0, lastReset: now };

        if (now - clientLimit.lastReset >= this.windowMs) {
            clientLimit.count = 0;
            clientLimit.lastReset = now;
        }

        if (clientLimit.count >= this.requestsPerWindow) {
            return false;
        }

        clientLimit.count++;
        this.limits.set(clientId, clientLimit);
        return true;
    }
}
