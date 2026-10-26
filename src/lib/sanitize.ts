import { Assignment, Condition, ConditionGroup, Trigger, Variable } from "@/types"

/**
 * Sanitise la valeur d'une condition/assignment selon le type de la variable :
 * - boolean : 'true' | 'false' (fallback : 'false')
 * - number  : nombre valide (fallback : '0')
 * - text    : string telle quelle
 */
export const sanitizeConditionValue = (value: string, variableType: Variable["type"] | undefined): string => {
    switch (variableType) {
        case 'boolean':
            // Legacy : les conditions booléennes créées avant le fix avaient '' (affiché 'true'
            // dans l'UI). On map donc tout sauf 'false' explicite sur 'true', pour restaurer
            // l'intention du créateur.
            return value === 'false' ? 'false' : 'true';
        case 'number':
            return isNaN(Number(value)) ? '0' : String(Number(value));
        default:
            return value;
    }
}

const findVariableByLabel = (variables: Variable[], label: string): Variable | undefined =>
    variables.find((v) => v.label === label);

/** Sanitise un groupe de conditions selon les types des variables de l'histoire */
export const sanitizeConditionGroups = (groups: ConditionGroup[] | undefined, variables: Variable[]): ConditionGroup[] =>
    (groups ?? []).map((group) => ({
        ...group,
        conditions: (group.conditions ?? []).map((c) => {
            const variable = findVariableByLabel(variables, c.label);
            if (!variable) return c;
            return {
                ...c,
                operation: (variable.type === 'number' || !['>', '>=', '<', '<='].includes(c.operation)) ? c.operation : '==',
                value: sanitizeConditionValue(c.value, variable.type)
            };
        })
    }));

/** Sanitise un assignment selon le type de la variable cible */
export const sanitizeAssignment = (assignment: Assignment, variables: Variable[]): Assignment => {
    const variable = findVariableByLabel(variables, assignment.label);
    if (!variable) return assignment;
    return {
        ...assignment,
        value: sanitizeConditionValue(assignment.value, variable.type)
    };
}

/** Sanitise la valeur d'une variable selon son type (ex: "false" en string → false) */
export const sanitizeVariableValue = (value: string | number | boolean | undefined, type: Variable["type"]): string | number | boolean => {
    switch (type) {
        case 'boolean': return typeof value === 'boolean' ? value : String(value) === 'true';
        case 'number': return isNaN(Number(value)) ? 0 : Number(value);
        default: return value === undefined || value === null ? '' : String(value);
    }
}

/** Sanitise l'ensemble des triggers d'une histoire */
export const sanitizeTriggers = (triggers: Trigger[] | undefined, variables: Variable[]): Trigger[] =>
    (triggers ?? []).map((trigger) => ({
        ...trigger,
        conditionGroups: sanitizeConditionGroups(trigger.conditionGroups, variables)
    }));

/**
 * Sanitise tout le graphe : conditions/assignments d'edges et triggers,
 * en alignant les valeurs sur les types des variables de l'histoire.
 * Répare les données corrompues par les anciens bugs (ex: value '' sur un booléen).
 */
export const sanitizeGraphData = (graph: {
    nodes: unknown[];
    edges: { data?: { conditionGroups?: ConditionGroup[]; assignments?: Assignment[] } }[];
    variables?: Variable[];
    triggers?: Trigger[];
}): { nodes: unknown[]; edges: { data?: { conditionGroups?: ConditionGroup[]; assignments?: Assignment[] } }[]; variables: Variable[]; triggers: Trigger[] } => {
    // Vieux graphes : edges/nodes/triggers potentiellement absents
    const nodes = graph?.nodes ?? [];
    const edges = graph?.edges ?? [];

    const variables = (graph?.variables ?? []).map((v) => ({
        ...v,
        value: sanitizeVariableValue(v.value, v.type)
    }));

    return {
        ...graph,
        nodes,
        edges: edges.map((edge) => ({
            ...edge,
            data: {
                ...edge.data,
                conditionGroups: sanitizeConditionGroups(edge.data?.conditionGroups, variables),
                assignments: (edge.data?.assignments ?? []).map((a) => sanitizeAssignment(a, variables))
            }
        })),
        variables,
        triggers: sanitizeTriggers(graph?.triggers, variables)
    };
}