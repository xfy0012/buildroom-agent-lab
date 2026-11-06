import { describe, expect, it, vi } from 'vitest';
import { FakeLLMProvider, runWorkflow } from '../src/lib/workflow';
describe('deterministic orchestration', () => {
    it('executes all four agents and stays within budget', () => {
        const s = runWorkflow('Cosy reading corner', 200);
        expect(s.status).toBe('completed');
        expect(s.steps).toBe(4);
        expect(s.next).toBeNull();
        expect(s.trace.map(t => t.agent)).toEqual(['RoomAgent', 'DesignAgent', 'SearchAgent', 'RenderAgent']);
        expect(s.render?.totalGBP).toBe(150);
        expect(s.render!.totalGBP).toBeLessThanOrEqual(s.budgetGBP);
        expect(s.trace[0].snapshot.selected).toEqual([]);
        expect(runWorkflow('Cosy reading corner', 200)).toEqual(s);
    });
    it('recovers from a transient failure', () => {
        const s = runWorkflow('Room', 200, { scenario: 'transient-failure' });
        expect(s.status).toBe('completed');
        expect(s.attempts.SearchAgent).toBe(2);
        expect(s.trace.filter(t => t.kind === 'retry')).toHaveLength(1);
    });
    it('bounds actual tool failures to initial attempt plus retries', () => {
        const search = vi.fn(() => { throw new Error('offline'); });
        const s = runWorkflow('Room', 200, { searchTool: { search } });
        expect(s.status).toBe('failed');
        expect(search).toHaveBeenCalledTimes(3);
        expect(s.next).toBeNull();
        expect(s.render).toBeUndefined();
    });
    it('allows no retries', () => {
        const s = runWorkflow('Room', 200, { scenario: 'tool-failure', maxRetries: 0 });
        expect(s.attempts.SearchAgent).toBe(1);
        expect(s.status).toBe('failed');
    });
    it('blocks repeated normalized searches before calling the tool again', () => {
        const search = vi.fn(() => []);
        const s = runWorkflow('Room', 200, { scenario: 'repeated-search', provider: { design: () => '  WARM   Room ' }, searchTool: { search } });
        expect(s.status).toBe('terminated');
        expect(s.reason).toBe('Repeated search prevented.');
        expect(s.searches).toEqual(['warm room']);
        expect(search).toHaveBeenCalledTimes(1);
    });
    it('enforces the global step limit even during retries', () => {
        const s = runWorkflow('Room', 200, { scenario: 'tool-failure', maxSteps: 3, maxRetries: 10 });
        expect(s.steps).toBe(3);
        expect(s.status).toBe('terminated');
        expect(s.attempts.SearchAgent).toBe(1);
        expect(s.reason).toContain('Step limit');
    });
    it('does not terminate a successful final step at the exact limit', () => expect(runWorkflow('Room', 200, { maxSteps: 4 }).status).toBe('completed'));
    it('bounds provider failures too', () => {
        const s = runWorkflow('Room', 200, { provider: { design: () => { throw new Error('provider unavailable'); } } });
        expect(s.status).toBe('failed');
        expect(s.attempts.DesignAgent).toBe(3);
    });
    it('supports an empty catalogue result', () => { const s = runWorkflow('Room', 0); expect(s.status).toBe('completed'); expect(s.render?.totalGBP).toBe(0); });
    it.each([NaN, Infinity, -1, 10001])('rejects invalid budget %s', budget => expect(() => runWorkflow('Room', budget)).toThrow());
    it.each([0, -1, 101, 1.5, NaN])('rejects invalid step bound %s', maxSteps => expect(() => runWorkflow('Room', 200, { maxSteps })).toThrow());
    it.each([-1, 11, 0.5, NaN])('rejects invalid retry bound %s', maxRetries => expect(() => runWorkflow('Room', 200, { maxRetries })).toThrow());
    it('rejects empty briefs', () => expect(() => runWorkflow(' ', 200)).toThrow());
    it('keeps runs isolated', () => { const a = runWorkflow('Room', 200); a.selected[0].name = 'changed'; expect(runWorkflow('Room', 200).selected[0].name).toBe('BILLY bookcase'); });
    it('uses the fake provider deterministically', () => expect(new FakeLLMProvider().design({ style: 'warm', purpose: 'workspace' })).toBe('warm workspace'));
});
