import {z} from 'zod';

export const EMPTY_WEBMCP_INPUT_SCHEMA = z.strictObject({});

export function invalidInputFromZodIssues(issues: readonly z.core.$ZodIssue[], input?: unknown) {
    const issue = issues.find((candidate) => candidate.code === 'unrecognized_keys') ?? issues[0];
    const field =
        issue.code === 'unrecognized_keys' && Array.isArray(issue.keys)
            ? String(issue.keys[0] ?? 'input').slice(0, 64)
            : String(issue.path[0] ?? 'input').slice(0, 64);
    let message = 'Input property has an unsupported type.';
    if (issue.code === 'unrecognized_keys') message = 'Unknown input property.';
    else if (issue.code === 'too_small' || issue.code === 'too_big') {
        if (issue.origin === 'string') {
            message =
                issue.path.length > 1
                    ? 'Input property has an item outside the supported length.'
                    : 'Input property is outside the supported length.';
        } else if (issue.origin === 'array') message = 'Input property is outside the supported item count.';
        else message = 'Input property is outside the supported range.';
    } else if (issue.code === 'invalid_value') {
        const actual = valueAtPath(input, issue.path);
        message =
            typeof actual === 'string'
                ? 'Input property is outside the supported values.'
                : 'Input property has an unsupported type.';
    } else if (issue.code === 'invalid_type' && issue.message.includes('received undefined')) {
        message =
            issue.path.length > 1 ? 'Input property has an unsupported type.' : 'Required input property is missing.';
    } else if (issue.path.length === 0) message = 'Tool input must be an object.';
    return {code: 'invalid_input' as const, message, details: {field}};
}

function valueAtPath(input: unknown, path: readonly PropertyKey[]): unknown {
    let value = input;
    for (const key of path) {
        if (typeof value !== 'object' || value === null) return undefined;
        value = (value as Record<PropertyKey, unknown>)[key];
    }
    return value;
}
