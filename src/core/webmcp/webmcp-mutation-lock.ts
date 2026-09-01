/**
 * One in-flight screen mutation at a time, shared by every mutating tool.
 *
 * The lock is module-level rather than per tool module: a separate flag in each
 * module would let two different tools mutate the same screen concurrently,
 * which is exactly what serialization is meant to prevent.
 */

import {webMcpResult, webMcpFailure} from './webmcp-envelope';

export const WEBMCP_BUSY_RESULT = webMcpResult(
    webMcpFailure({code: 'busy', message: 'Another Lopaka screen change is still running. Retry shortly.'})
);

let mutationInProgress = false;

/** Run a synchronous mutation, or answer `onBusy` when one is already running. */
export function runExclusiveWebMcpMutation<TResult>(run: () => TResult, onBusy: () => TResult): TResult {
    if (mutationInProgress) {
        return onBusy();
    }
    mutationInProgress = true;
    try {
        return run();
    } finally {
        mutationInProgress = false;
    }
}

/**
 * The asynchronous form, for a mutation that must await a dependency such as a
 * font load or a screen change. The lock is held for the whole operation.
 */
export async function runExclusiveWebMcpMutationAsync<TResult>(
    run: () => Promise<TResult>,
    onBusy: () => TResult
): Promise<TResult> {
    if (mutationInProgress) {
        return onBusy();
    }
    mutationInProgress = true;
    try {
        return await run();
    } finally {
        mutationInProgress = false;
    }
}
