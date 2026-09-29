export const routineLanguage = /\b(every|everyday|daily|weekly|monthly|hourly|recurring|schedule(?:d)?|routine|automation|automatically|monitor|digest|each\s+(?:day|morning|evening|week|month)|remind\s+me|tomorrow|tonight)\b/i;
export const runRoutineLanguage = /\b(?:run|execute|start|trigger|launch)\b[\s\S]{0,80}\b(?:routine|automation)\b|\b(?:routine|automation)\b[\s\S]{0,80}\b(?:now|run|execute|start|trigger|launch)\b/i;
export const timePattern =
    /\b(?:[01]?\d|2[0-3])(?:h(?:[0-5]\d)?|:[0-5]\d)\b|\b(?:1[0-2]|0?[1-9])(?::[0-5]\d)?\s*(?:a\.?m\.?|p\.?m\.?)\b/i;

export function getLatestUserText(messages: any[]): string {
    return [...messages]
        .reverse()
        .find((m) => m?.role === "user" && typeof m?.content === "string")
        ?.content ?? "";
}

export function getAllUserText(messages: any[]): string {
    return messages
        .filter((m) => m?.role === "user" && typeof m?.content === "string")
        .map((m) => m.content)
        .join("\n");
}

export function isRoutinePlanningConversation(messages: any[]) {
    const latestUserMessage = [...messages].reverse().find((m) => m?.role === "user");
    if (routineLanguage.test(latestUserMessage?.content ?? "")) return true;

    const previousAgentMessage = [...messages]
        .reverse()
        .find((m) => m?.role === "agent" || m?.role === "assistant");

    return previousAgentMessage?.response?.intent === "routine"
        && previousAgentMessage?.response?.type === "clarification";
}

export function dedupeSuggestions<T extends { slug: string }>(suggestions: T[]) {
    return [
        ...new Map(suggestions.map((s) => [s.slug.toLowerCase(), s])).values(),
    ];
}

export function includesCatalogTool(text: string, slug: string, name: string) {
    const terms = [slug, name]
        .map((term) => term.trim().toLowerCase())
        .filter((term) => term.length >= 3);

    return terms.some((term) => {
        const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        return new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`, "i").test(text);
    });
}

export function normalizeMatchText(value: string) {
    return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

export function requiresVmDesktopForRequest(text: string) {
    if (!text) return false;

    const hasWebAction = /\b(?:give me|show me|find|look up|search|read|fetch|get|check|view|visit|browse|open|latest|top|current|breaking|headlines?|inspect|review|compare)\b/i.test(text);
    const hasNewsSignal = /\b(?:google\s+news|news\.google(?:\.com)?|ai\s+news|latest\s+news|top\s+news|breaking\s+news|headlines?|news\b)/i.test(text);
    const hasWebTarget = /\b(?:google\s+news|news\.google(?:\.com)?|reddit|youtube|wikipedia|github|amazon|news\b|website|webpage|site|page|product|price|cost|link|url|search\s+the\s+web)\b/i.test(text);
    const hasUrl = /(?:https?:\/\/|www\.)[\w.-]+\.[a-z]{2,}(?:\/[^\s]*)?/i.test(text);
    const hasPageContext = /\b(?:from\s+the\s+page|on\s+the\s+page|from\s+this\s+link|this\s+link|product\s+cost|current\s+price|current\s+cost|price\s+from\s+the\s+page)\b/i.test(text);

    return Boolean(
        hasUrl
        || hasPageContext
        || (hasWebAction && hasWebTarget)
        || (hasNewsSignal && hasWebAction)
        || /\b(?:google\s+news|news\.google(?:\.com)?)\b/i.test(text)
    );
}