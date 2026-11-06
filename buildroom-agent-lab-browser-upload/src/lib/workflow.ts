export const agents = ['RoomAgent', 'DesignAgent', 'SearchAgent', 'RenderAgent'] as const;
export type Agent = typeof agents[number];
export type Scenario = 'success' | 'transient-failure' | 'tool-failure' | 'repeated-search' | 'termination-limit';
export type Product = {
    id: string;
    name: string;
    category: string;
    priceGBP: number;
};
// Fictional UK fixtures, not live IKEA prices, inventory, or an endorsement.
export const products: readonly Product[] = [
    { id: 'mock-billy', name: 'BILLY bookcase', category: 'storage', priceGBP: 55 },
    { id: 'mock-poang', name: 'POÄNG armchair', category: 'seating', priceGBP: 80 },
    { id: 'mock-lack', name: 'LACK side table', category: 'table', priceGBP: 15 },
];
export type WorkflowData = {
    brief: string;
    budgetGBP: number;
    room?: {
        purpose: string;
        style: string;
    };
    query?: string;
    selected: Product[];
    searches: string[];
    render?: {
        title: string;
        totalGBP: number;
    };
};
export type TraceEvent = {
    id: number;
    step: number;
    agent: Agent;
    kind: 'success' | 'retry' | 'failed' | 'terminated';
    message: string;
    snapshot: WorkflowData;
};
export type WorkflowState = WorkflowData & {
    status: 'running' | 'completed' | 'failed' | 'terminated';
    next: Agent | null;
    steps: number;
    attempts: Record<Agent, number>;
    trace: TraceEvent[];
    reason?: string;
};
export interface LLMProvider {
    design(room: NonNullable<WorkflowData['room']>): string;
}
export class FakeLLMProvider implements LLMProvider {
    design(room: NonNullable<WorkflowData['room']>) { return `${room.style} ${room.purpose}`; }
}
export interface SearchTool {
    search(query: string, budgetGBP: number): Product[];
}
export class MockIkeaSearch implements SearchTool {
    search(_query: string, budgetGBP: number) {
        let remaining = budgetGBP;
        return products.filter(p => {
            if (p.priceGBP > remaining) return false;
            remaining -= p.priceGBP;
            return true;
        }).map(p => ({ ...p }));
    }
}
export type Options = {
    scenario?: Scenario;
    maxSteps?: number;
    maxRetries?: number;
    provider?: LLMProvider;
    searchTool?: SearchTool;
};
function snapshot(s: WorkflowState): WorkflowData {
    return structuredClone({ brief: s.brief, budgetGBP: s.budgetGBP, room: s.room, query: s.query, selected: s.selected, searches: s.searches, render: s.render });
}
export function runWorkflow(brief: string, budgetGBP: number, options: Options = {}): WorkflowState {
    const scenario = options.scenario ?? 'success';
    const maxSteps = options.maxSteps ?? (scenario === 'termination-limit' ? 3 : 12);
    const maxRetries = options.maxRetries ?? 2;
    if (!brief.trim() || brief.length > 500 || !Number.isFinite(budgetGBP) || budgetGBP < 0 || budgetGBP > 10000)
        throw new Error('Enter a brief (1–500 characters) and budget (£0–£10,000).');
    if (!Number.isInteger(maxSteps) || maxSteps < 1 || maxSteps > 100 || !Number.isInteger(maxRetries) || maxRetries < 0 || maxRetries > 10)
        throw new Error('Limits must be integers: steps 1–100, retries 0–10.');
    const provider = options.provider ?? new FakeLLMProvider();
    const searchTool = options.searchTool ?? new MockIkeaSearch();
    const s: WorkflowState = { brief: brief.trim(), budgetGBP, selected: [], searches: [], status: 'running', next: 'RoomAgent', steps: 0, attempts: { RoomAgent: 0, DesignAgent: 0, SearchAgent: 0, RenderAgent: 0 }, trace: [] };
    const record = (agent: Agent, kind: TraceEvent['kind'], message: string) => s.trace.push({ id: s.trace.length + 1, step: s.steps, agent, kind, message, snapshot: snapshot(s) });
    const stop = (agent: Agent, status: 'failed' | 'terminated', reason: string) => { s.status = status; s.next = null; s.reason = reason; record(agent, status, reason); };
    while (s.status === 'running' && s.next) {
        const agent: Agent = s.next;
        if (s.steps >= maxSteps) {
            stop(agent, 'terminated', `Step limit reached (${maxSteps}).`);
            break;
        }
        s.steps++;
        s.attempts[agent]++;
        try {
            switch (agent) {
                case 'RoomAgent':
                    s.room = { purpose: /office|work/i.test(s.brief) ? 'workspace' : 'living room', style: /warm|cosy/i.test(s.brief) ? 'warm' : 'minimal' };
                    s.next = 'DesignAgent';
                    break;
                case 'DesignAgent':
                    s.query = provider.design(s.room!);
                    s.next = 'SearchAgent';
                    break;
                case 'SearchAgent': {
                    const query = s.query!.trim().toLowerCase().replace(/\s+/g, ' ');
                    if (s.searches.includes(query)) {
                        stop(agent, 'terminated', 'Repeated search prevented.');
                        continue;
                    }
                    if (scenario === 'tool-failure' || (scenario === 'transient-failure' && s.attempts.SearchAgent === 1))
                        throw new Error('Simulated catalogue unavailable.');
                    s.selected = searchTool.search(query, s.budgetGBP);
                    s.searches.push(query);
                    s.next = scenario === 'repeated-search' ? 'SearchAgent' : 'RenderAgent';
                    break;
                }
                case 'RenderAgent':
                    s.render = { title: `${s.room!.style} ${s.room!.purpose}`, totalGBP: s.selected.reduce((sum, p) => sum + p.priceGBP, 0) };
                    s.status = 'completed';
                    s.next = null;
                    break;
            }
            record(agent, 'success', `${agent} completed.`);
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown tool failure.';
            if (s.attempts[agent] > maxRetries)
                stop(agent, 'failed', `Retry limit reached: ${message}`);
            else
                record(agent, 'retry', `${message} Retry ${s.attempts[agent]}/${maxRetries}.`);
        }
    }
    return s;
}
