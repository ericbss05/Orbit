import { Agent, assistant, run, user } from "@openai/agents";
import { z } from "zod";
import { createDesktopComputerTool } from "@/lib/e2b/agent-computer";
import { AgentResponse, RoutineDraft, agentResponseSchema } from "./agent-response-schema";
import { getClarificationAnswer } from "./clarification-context";
import {
    buildAgentInstructions,
    buildRoutineInstructions,
    serializeClarificationAnswer,
    serializeResponseForHistory,
} from "./prompts";

const MAX_AGENT_TURNS = 10;
const MAX_COMPUTER_AGENT_TURNS = 50;

const maxTurnsFallback = agentResponseSchema.parse({
    type: "message",
    intent: "conversation",
    message:
        "I couldn't complete that request because the tool workflow did not finish. No further tool calls were attempted. Please try again, or rephrase the request with the exact app and action you want me to use.",
    questions: [],
    suggestedTools: [],
    routine: null,
    confirmation: null,
});

function errorMessage(error: unknown) {
    return error instanceof Error ? error.message : String(error);
}

function isComputerModelAccessError(message: string) {
    return /model [`'"]?[\w.-]+[`'"]?.*(does not exist|do not have access)|404.*model/i
        .test(message);
}

function createDesktopRunFailureResponse(detail: string) {
    const message = isComputerModelAccessError(detail)
        ? [
            "The VM desktop tool is connected, but this OpenAI project does not have access to the computer-use model required to drive it.",
            "",
            `Error: ${detail}`,
            "",
            "Set `OPENAI_COMPUTER_MODEL` to a computer-use capable model your project can access. Until that model is available, the agent cannot autonomously operate the E2B desktop.",
        ].join("\n")
        : [
            "I tried to use the VM desktop, but the desktop-enabled agent run failed before it could finish.",
            "",
            `Error: ${detail}`,
            "",
            "If the VM is showing login, captcha, MFA, or a browser consent screen, open the VM desktop, complete that step, then ask me to continue.",
        ].join("\n");

    return agentResponseSchema.parse({
        ...maxTurnsFallback,
        intent: "immediate_action",
        message,
    });
}

export type Message = {
    role: "user" | "agent" | "assistant";
    content: string;
    response?: AgentResponse;
};

const routineExecutionSchema = z.object({
    status: z.enum(["completed", "failed"]),
    summary: z.string(),
    error: z.string().nullable().default(null),
});

type VmDesktopContext = {
    agentId: string;
    userEmail: string;
};

function toolsetNeedsComputerModel(tools: any[]) {
    return tools.some((tool) => tool?.type === "computer");
}

function getModelForTools(tools: any[]) {
    if (toolsetNeedsComputerModel(tools)) {
        return process.env.OPENAI_COMPUTER_MODEL || "gpt-5.6-luna";
    }

    return process.env.OPENAI_MODEL || "gpt-5.4-mini";
}

export const createAgent = (
    name: string,
    instructions: string,
    tools: any[] = [],
    outputType: typeof agentResponseSchema | "text" = agentResponseSchema
) => {
    return new Agent({
        name: name,
        instructions: instructions,
        tools: [...tools],
        model: getModelForTools(tools),
        outputType,
    });
};

export const executeAgentChat = async (
    name: string,
    instructions: string,
    messages: Message[],
    tools: any[] = [],
    availableTools: Array<{
        slug: string;
        name: string;
        description: string;
    }> = [],
    connectedToolSlugs: string[] = [],
    timezone = "UTC",
    planningOnly = false,
    editingRoutine: RoutineDraft | null = null,
    vmDesktopContext: VmDesktopContext | null = null
) => {
    const desktopTool = !planningOnly && vmDesktopContext
        ? createDesktopComputerTool(vmDesktopContext)
        : null;
    const runtimeTools = desktopTool ? [...tools, desktopTool] : tools;
    const formattedInstructions = buildAgentInstructions(
        name,
        instructions,
        availableTools,
        connectedToolSlugs,
        timezone,
        planningOnly,
        editingRoutine,
        Boolean(desktopTool)
    );
    const agent = createAgent(
        name,
        formattedInstructions,
        planningOnly ? [] : runtimeTools,
        desktopTool ? "text" : agentResponseSchema
    );

    const history = messages.map((msg, index) => {
        const clarification = msg.role === "user"
            ? getClarificationAnswer(messages, index)
            : null;
        const content = msg.response
            ? serializeResponseForHistory(msg.response)
            : clarification
                ? serializeClarificationAnswer(clarification)
                : msg.content;

        return (
            msg.role === "assistant" || msg.role === "agent"
                ? assistant(content)
                : user(content)
        );
    });

    let result;
    try {
        result = await run(agent, history, {
            maxTurns: desktopTool ? MAX_COMPUTER_AGENT_TURNS : MAX_AGENT_TURNS,
            errorHandlers: {
                maxTurns: ({ error, runData }) => {
                    console.error("Agent tool workflow exceeded the turn limit", {
                        agent: name,
                        maxTurns: desktopTool ? MAX_COMPUTER_AGENT_TURNS : MAX_AGENT_TURNS,
                        vmDesktopEnabled: Boolean(desktopTool),
                        generatedItems: runData.newItems.length,
                        error: error.message,
                    });

                    return {
                        finalOutput: desktopTool
                            ? agentResponseSchema.parse({
                                ...maxTurnsFallback,
                                intent: "immediate_action",
                                message:
                                    "I opened the VM desktop path, but the browser workflow took too many steps and I had to stop. If the VM is on a login, captcha, MFA, or consent screen, please open the VM desktop, complete that step, then ask me to continue.",
                            })
                            : maxTurnsFallback,
                    };
                },
            },
        });
    } catch (error: any) {
        console.error("OpenAI agent run failed", { agent: name, error });
        const detail = errorMessage(error);
        return {
            response: desktopTool
                ? createDesktopRunFailureResponse(detail)
                : maxTurnsFallback,
            pendingApproval: null,
        };
    }

    try {
        if (result?.interruptions && result.interruptions.length > 0) {
            return {
                response: null,
                pendingApproval: {
                    state: result.state?.toString() ?? "",
                    actions: result.interruptions.map((interruption) => ({
                        tool: interruption.name ?? "External action",
                        arguments: interruption.arguments ?? "{}",
                    })),
                },
            };
        }

        const finalOutput = result?.finalOutput ?? maxTurnsFallback;
        if (desktopTool && typeof finalOutput === "string") {
            return {
                response: agentResponseSchema.parse({
                    type: "message",
                    intent: "immediate_action",
                    message: finalOutput,
                    questions: [],
                    suggestedTools: [],
                    routine: null,
                    confirmation: null,
                }),
                pendingApproval: null,
            };
        }

        const parsed = agentResponseSchema.safeParse(finalOutput);
        if (!parsed.success) {
            console.error("Agent returned invalid finalOutput", { agent: name, finalOutput });
            return { response: maxTurnsFallback, pendingApproval: null };
        }

        return { response: parsed.data, pendingApproval: null };
    } catch (error) {
        console.error("Failed to process agent run result", { agent: name, error, result });
        return { response: maxTurnsFallback, pendingApproval: null };
    }
};

export const executeRoutine = async (
    name: string,
    routineInstructions: string,
    tools: any[],
    timezone: string,
    vmDesktopContext: VmDesktopContext | null = null
) => {
    const desktopTool = vmDesktopContext
        ? createDesktopComputerTool(vmDesktopContext)
        : null;
    const runtimeTools = desktopTool ? [...tools, desktopTool] : tools;
    const agent = new Agent({
        name,
        model: getModelForTools(runtimeTools),
        tools: runtimeTools,
        outputType: routineExecutionSchema,
        instructions: buildRoutineInstructions(
            name,
            routineInstructions,
            timezone,
            Boolean(desktopTool)
        ),
    });

    const routineResult = await run(agent, "Run the approved routine now.", {
        maxTurns: desktopTool ? 30 : 12,
    });

    if (!routineResult?.finalOutput) {
        throw new Error("The routine execution did not return a result");
    }

    return routineExecutionSchema.parse(routineResult.finalOutput);
};