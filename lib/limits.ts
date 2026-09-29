const DAILY_REQUEST_LIMIT = 25;
const DAILY_ROUTINE_LIMIT = 3;

type Usage = {
    date: string;
    requests: number;
    routines: number;
};

const usageStore = new Map<string, Usage>();

function getTodayKey() {
    return new Date().toISOString().slice(0, 10);
}

function getOrCreateUsage(userId: string, today: string): Usage {
    const existing = usageStore.get(userId);

    if (!existing || existing.date !== today) {
        const usage = {
            date: today,
            requests: 0,
            routines: 0,
        };

        usageStore.set(userId, usage);
        return usage;
    }

    return existing;
}

export function checkAndConsumeRequestLimit(userId: string) {
    const today = getTodayKey();
    const usage = getOrCreateUsage(userId, today);

    if (usage.requests >= DAILY_REQUEST_LIMIT) {
        return {
            allowed: false,
            used: usage.requests,
            limit: DAILY_REQUEST_LIMIT,
            remaining: 0,
        };
    }

    usage.requests += 1;
    usageStore.set(userId, usage);

    return {
        allowed: true,
        used: usage.requests,
        limit: DAILY_REQUEST_LIMIT,
        remaining: DAILY_REQUEST_LIMIT - usage.requests,
    };
}

export function checkAndConsumeRoutineLimit(userId: string) {
    const today = getTodayKey();
    const usage = getOrCreateUsage(userId, today);

    if (usage.routines >= DAILY_ROUTINE_LIMIT) {
        return {
            allowed: false,
            used: usage.routines,
            limit: DAILY_ROUTINE_LIMIT,
            remaining: 0,
        };
    }

    usage.routines += 1;
    usageStore.set(userId, usage);

    return {
        allowed: true,
        used: usage.routines,
        limit: DAILY_ROUTINE_LIMIT,
        remaining: DAILY_ROUTINE_LIMIT - usage.routines,
    };
}

export function getRequestUsage(userId: string) {
    const today = getTodayKey();
    const usage = usageStore.get(userId);

    if (!usage || usage.date !== today) {
        return {
            used: 0,
            limit: DAILY_REQUEST_LIMIT,
            remaining: DAILY_REQUEST_LIMIT,
        };
    }

    return {
        used: usage.requests,
        limit: DAILY_REQUEST_LIMIT,
        remaining: Math.max(
            0,
            DAILY_REQUEST_LIMIT - usage.requests
        ),
    };
}

export function getRoutineUsage(userId: string) {
    const today = getTodayKey();
    const usage = usageStore.get(userId);

    if (!usage || usage.date !== today) {
        return {
            used: 0,
            limit: DAILY_ROUTINE_LIMIT,
            remaining: DAILY_ROUTINE_LIMIT,
        };
    }

    return {
        used: usage.routines,
        limit: DAILY_ROUTINE_LIMIT,
        remaining: Math.max(
            0,
            DAILY_ROUTINE_LIMIT - usage.routines
        ),
    };
}