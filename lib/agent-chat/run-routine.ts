import { and, eq } from "drizzle-orm";
import { db, Routines } from "@/db";
import { agentResponseSchema } from "@/lib/openai/agent-response-schema";
import { triggerRoutineRunNow } from "@/lib/routines/run-now";
import { normalizeMatchText } from "./patterns";

function findRoutineForImmediateRun<T extends { id: string; name: string; goal: string; isActive: boolean }>(
    text: string,
    routines: T[]
) {
    const activeRoutines = routines.filter((r) => r.isActive);
    if (activeRoutines.length === 0) return { routine: null, candidates: [] as T[] };

    const normalizedText = normalizeMatchText(text);
    const exactMatches = activeRoutines.filter((r) => {
        const n = normalizeMatchText(r.name);
        return n.length > 0 && normalizedText.includes(n);
    });

    if (exactMatches.length === 1) return { routine: exactMatches[0], candidates: exactMatches };
    if (exactMatches.length > 1) return { routine: null, candidates: exactMatches };

    const tokenMatches = activeRoutines.filter((r) =>
        normalizeMatchText(`${r.name} ${r.goal}`)
            .split(" ")
            .filter((t) => t.length >= 4)
            .some((t) => normalizedText.includes(t))
    );

    if (tokenMatches.length === 1) return { routine: tokenMatches[0], candidates: tokenMatches };
    if (activeRoutines.length === 1) return { routine: activeRoutines[0], candidates: activeRoutines };

    return { routine: null, candidates: tokenMatches.length > 0 ? tokenMatches : activeRoutines };
}

const immediate = (over: Record<string, unknown>) =>
    agentResponseSchema.parse({
        type: "message",
        intent: "immediate_action",
        message: "",
        questions: [],
        suggestedTools: [],
        routine: null,
        confirmation: null,
        ...over,
    });

/** Retourne la réponse de l'agent pour une demande "lance la routine X". */
export async function handleRunRoutine(params: {
    agentId: string;
    userEmail: string;
    latestUserText: string;
}) {
    const { agentId, userEmail, latestUserText } = params;

    const savedRoutines = await db
        .select()
        .from(Routines)
        .where(and(eq(Routines.agentId, agentId), eq(Routines.userEmail, userEmail)));

    if (savedRoutines.length === 0) {
        return immediate({ message: "You do not have any saved routines for this agent yet." });
    }

    const { routine, candidates } = findRoutineForImmediateRun(latestUserText, savedRoutines);
    if (!routine) {
        return immediate({
            type: "clarification",
            message: "Which routine should I run now?",
            questions: [{
                id: "routine_to_run",
                question: "Choose one routine to execute.",
                options: candidates.map((c) => ({
                    label: c.name,
                    value: `Run routine ${c.name}`,
                    description: c.goal,
                })),
            }],
        });
    }

    const runResult = await triggerRoutineRunNow({ agentId, routineId: routine.id, userEmail });

    if ("error" in runResult) return immediate({ message: runResult.error });

    return immediate({
        message: runResult.alreadyRunning
            ? `“${runResult.routine.name}” is already running. I will not start a duplicate execution.`
            : `Started “${runResult.routine.name}” now. You can track its status in the Schedule tab.`,
    });
}