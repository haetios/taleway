"use client"

import { useMemo, useState } from "react";
import useStoryData from "./useStoryData";
import { isNode } from "@xyflow/react";
import { ConditionGroup, ContentItem, NodeData, StoryEdge, StoryNode, Variable, Assignment, Trigger, Condition, TriggerAction } from "@/types";

// Valeur par défaut d'une condition/assignment selon le type de la variable
export const defaultValueForVariable = (variable: Variable | undefined): string => {
    if (!variable) return '';
    switch (variable.type) {
        case 'boolean': return 'true';
        case 'number': return '0';
        default: return '';
    }
}

export default function usePanelContent(
    storyData: ReturnType<typeof useStoryData>,
    setIsSaved: (value: boolean) => void
) {
    const [currentId, setCurrentId] = useState<string|undefined>(undefined)
    const current = useMemo(
        () => storyData.nodes.find((n) => n.id === currentId) ?? storyData.edges.find((e) => e.id === currentId),
        [storyData.nodes, storyData.edges, currentId]
    )

    //---------- EDGE/NODE ----------//
    const onFieldChange = (field: keyof StoryEdge| keyof StoryNode, value: string) => {
        if (!current) return;

        if (isNode(current)) {
            storyData.setNodes((nodes) =>
                nodes.map((n) =>
                    n.id === current.id ? { ...n, [field as string]: value} : n
                )
            )
        } else {
            storyData.setEdges((edges) =>
                edges.map((e) =>
                    e.id === current.id ? { ...e, [field as string]: value} : e
                )
            )
        }

        setIsSaved(false);
    }

    //---------- EDGE ----------//
    const onAddGroup = () => {
        if (!current) return;
        if (storyData.variables.filter((v) => v.label !== '').length <= 0) return;

        storyData.setEdges((edges) =>
            edges.map((e) =>
                current?.id === e.id
                    ? { ...e, data: { ...e.data, conditionGroups: [...e.data.conditionGroups, { conditions: [] }] }}
                    : e
            )
        );
        setIsSaved(false);
    }
    const onAddCondition = (groupIndex: number) => {
        if (!current) return;
        const firstValidVariable = storyData.variables.filter((v) => v.label !== '').at(0);
        if (!firstValidVariable) return;

        storyData.setEdges((edges) =>
            edges.map((e) =>
                current?.id === e.id
                    ? { ...e, data: { ...e.data, conditionGroups: e.data.conditionGroups.map((g, gi) =>
                        gi === groupIndex
                            ? { ...g, conditions: [...g.conditions, { label: firstValidVariable.label, operation: '==', value: defaultValueForVariable(firstValidVariable) }]}
                            : g
                      )}}
                    : e
            )
        );
        setIsSaved(false);
    }
    const onRemoveGroup = (groupIndex: number) => {
        if (!current) return;
        storyData.setEdges((edges) =>
            edges.map((e) =>
                current?.id === e.id
                    ? { ...e, data: { ...e.data, conditionGroups: e.data.conditionGroups.filter((_, gi) => gi !== groupIndex) }}
                    : e
            )
        );
        setIsSaved(false);
    }
    const onRemoveCondition = (groupIndex: number, conditionIndex: number) => {
        if (!current) return;
        storyData.setEdges((edges) =>
            edges.map((e) =>
                current?.id === e.id
                    ? { ...e, data: { ...e.data, conditionGroups: e.data.conditionGroups.map((g, gi) =>
                        gi === groupIndex
                            ? { ...g, conditions: g.conditions.filter((_, ci) => ci !== conditionIndex) }
                            : g
                      )}}
                    : e
            )
        );
        setIsSaved(false);
    }

    //---------- ASSIGNMENT ----------//
    const onAddAssignment = () => {
        if (!current) return;
        const firstValidVariable = storyData.variables.filter((v) => v.label !== '').at(0);
        if (!firstValidVariable) return;

        storyData.setEdges((edges) =>
            edges.map((e) =>
                current?.id === e.id
                    ? { ...e, data: { ...e.data, assignments: [...(e.data.assignments ?? []), { label: firstValidVariable.label, operation: '=', value: defaultValueForVariable(firstValidVariable) }] }}
                    : e
            )
        );
        setIsSaved(false);
    }
    const onRemoveAssignment = (index: number) => {
        if (!current) return;
        storyData.setEdges((edges) =>
            edges.map((e) =>
                current?.id === e.id
                    ? { ...e, data: { ...e.data, assignments: (e.data.assignments ?? []).filter((_, i) => i !== index) }}
                    : e
            )
        );
        setIsSaved(false);
    }
    const onAssignmentChanged = (index: number, field: keyof Assignment, value: string) => {
        if (!current) return;
        storyData.setEdges((edges) =>
            edges.map((e) =>
                current?.id === e.id
                    ? { ...e, data: { ...e.data, assignments: (e.data.assignments ?? []).map((a, i) => {
                        if (i !== index) return a;
                        // Quand on change la variable, on réinitialise valeur et opération selon son type
                        if (field === 'label') {
                            const newVariable = storyData.variables.filter((v) => v.label === value).at(0);
                            return {
                                ...a,
                                label: value,
                                value: defaultValueForVariable(newVariable),
                                operation: newVariable?.type === 'number' ? a.operation : '='
                            };
                        }
                        return { ...a, [field]: value };
                      })}}
                    : e
            )
        );
        setIsSaved(false);
    }

    //---------- NODE DATA ----------//
    const onDataChange = (field: keyof NodeData, value: string|ContentItem[]|ConditionGroup[]|Assignment[]) => {
        if (!current) return;

        if(isNode(current)) {
            storyData.setNodes((nodes) =>
                nodes.map((n) =>
                    current?.id === n.id
                        ? { ...n, data: { ...n.data, [field]: value}}
                        : n
                )
            );
        } else {
            storyData.setEdges((edges) =>
                edges.map((e) =>
                    current?.id === e.id
                        ? { ...e, data: { ...e.data, [field]: value}}
                        : e
                )
            );
        }
        setIsSaved(false);
    }
    const onAddParagraph = () => {
        if (!current) return;

        storyData.setNodes((nodes) =>
            nodes.map((n: StoryNode) =>
                current.id === n.id
                    ? { ...n, data: { ...n.data, content: [...n.data.content, { id: crypto.randomUUID(), type: 'paragraph', content: '' }] }}
                    : n
            )
        );
        setIsSaved(false);
    }
    const onAddImage = () => {
        if (!current) return;

        storyData.setNodes((nodes) =>
            nodes.map((n: StoryNode) =>
                current.id === n.id
                    ? { ...n, data: { ...n.data, content: [...n.data.content, { id: crypto.randomUUID(), type: 'image', content: '' }] }}
                    : n
            )
        )
        setIsSaved(false)
    }

    //---------- VARIABLE ----------//
    const onVariableChange = (index: number, field: keyof Variable, value: string | number | boolean) => {
        storyData.setVariables((vars) => vars.map((v, i) => i === index ? { ...v, [field]: value } : v));
        setIsSaved(false);
    }
    const onAddVariable = () => {
        storyData.setVariables((vars) => [
            ...vars,
            { label: '', type: 'text', value: '', visible: false}
        ]);
        setIsSaved(false);
    }
    const onRemoveVariable = (index: number) => {
        const variableToDelete = storyData.variables.filter((_, i) => i === index).at(0);
        if (!variableToDelete) return;

        storyData.setVariables(storyData.variables.filter((_, i) => i !== index))
        storyData.setEdges((edges) =>
            edges.map((e) => ({
                ...e,
                data: {
                    ...e.data,
                    conditionGroups: e.data.conditionGroups.map((g) => ({
                        ...g,
                        conditions: g.conditions.filter((c) => c.label !== variableToDelete.label)
                    })),
                    assignments: (e.data.assignments ?? []).filter((a) => a.label !== variableToDelete.label)
                }
            }))
        );
        setIsSaved(false);
    }

    //---------- TRIGGER ----------//
    const onAddTrigger = () => {
        if (storyData.variables.filter((v) => v.label !== '').length <= 0) return;
        storyData.setTriggers((triggers) => [...triggers, { id: crypto.randomUUID(), conditionGroups: [], actions: [] }]);
        setIsSaved(false);
    }
    const onRemoveTrigger = (index: number) => {
        storyData.setTriggers((triggers) => triggers.filter((_, i) => i !== index));
        setIsSaved(false);
    }
    const onTriggerAddGroup = (triggerIndex: number) => {
        if (storyData.variables.filter((v) => v.label !== '').length <= 0) return;
        storyData.setTriggers((triggers) => triggers.map((t, ti) =>
            ti === triggerIndex ? { ...t, conditionGroups: [...t.conditionGroups, { conditions: [] }] } : t
        ));
        setIsSaved(false);
    }
    const onTriggerAddCondition = (triggerIndex: number, groupIndex: number) => {
        const firstValidVariable = storyData.variables.filter((v) => v.label !== '').at(0);
        if (!firstValidVariable) return;
        storyData.setTriggers((triggers) => triggers.map((t, ti) =>
            ti === triggerIndex ? { ...t, conditionGroups: t.conditionGroups.map((g, gi) =>
                gi === groupIndex ? { ...g, conditions: [...g.conditions, { label: firstValidVariable.label, operation: '==', value: defaultValueForVariable(firstValidVariable) }] } : g
            )} : t
        ));
        setIsSaved(false);
    }
    const onTriggerRemoveGroup = (triggerIndex: number, groupIndex: number) => {
        storyData.setTriggers((triggers) => triggers.map((t, ti) =>
            ti === triggerIndex ? { ...t, conditionGroups: t.conditionGroups.filter((_, gi) => gi !== groupIndex) } : t
        ));
        setIsSaved(false);
    }
    const onTriggerRemoveCondition = (triggerIndex: number, groupIndex: number, conditionIndex: number) => {
        storyData.setTriggers((triggers) => triggers.map((t, ti) =>
            ti === triggerIndex ? { ...t, conditionGroups: t.conditionGroups.map((g, gi) =>
                gi === groupIndex ? { ...g, conditions: g.conditions.filter((_, ci) => ci !== conditionIndex) } : g
            )} : t
        ));
        setIsSaved(false);
    }
    const onTriggerConditionsChanged = (triggerIndex: number, groupIndex: number, conditionIndex: number, field: keyof Condition, value: string) => {
        storyData.setTriggers((triggers) => triggers.map((t, ti) =>
            ti === triggerIndex ? { ...t, conditionGroups: t.conditionGroups.map((g, gi) =>
                gi === groupIndex ? { ...g, conditions: g.conditions.map((c, ci) => {
                    if (ci !== conditionIndex) return c;
                    // Quand on change la variable, on réinitialise valeur et opération selon son type
                    if (field === 'label') {
                        const newVariable = storyData.variables.filter((v) => v.label === value).at(0);
                        return {
                            ...c,
                            label: value,
                            value: defaultValueForVariable(newVariable),
                            // Les opérateurs de comparaison ne sont valables que sur les nombres
                            operation: newVariable?.type === 'number' || !['>', '>=', '<', '<='].includes(c.operation) ? c.operation : '=='
                        };
                    }
                    return { ...c, [field]: value };
                })} : g
            )} : t
        ));
        setIsSaved(false);
    }
    const onAddAction = (triggerIndex: number) => {
        storyData.setTriggers((triggers) => triggers.map((t, ti) =>
            ti === triggerIndex ? { ...t, actions: [...t.actions, { type: 'redirect', target: '' }] } : t
        ));
        setIsSaved(false);
    }
    const onRemoveAction = (triggerIndex: number, actionIndex: number) => {
        storyData.setTriggers((triggers) => triggers.map((t, ti) =>
            ti === triggerIndex ? { ...t, actions: t.actions.filter((_, ai) => ai !== actionIndex) } : t
        ));
        setIsSaved(false);
    }
    const onActionChanged = (triggerIndex: number, actionIndex: number, field: string, value: string) => {
        storyData.setTriggers((triggers) => triggers.map((t, ti) =>
            ti === triggerIndex ? { ...t, actions: t.actions.map((a, ai) => {
                if (ai !== actionIndex) return a;
                if (field === 'type') {
                    // Quand on change le type, on réinitialise l'action
                    if (value === 'redirect') return { type: 'redirect', target: '' };
                    if (value === 'assignment') {
                        const firstValidVariable = storyData.variables.filter((v) => v.label !== '').at(0);
                        return { type: 'assignment', label: firstValidVariable?.label ?? '', operation: '=', value: defaultValueForVariable(firstValidVariable) };
                    }
                    return a;
                }
                // Quand on change la variable, on réinitialise valeur et opération selon son type
                if (field === 'label' && a.type === 'assignment') {
                    const newVariable = storyData.variables.filter((v) => v.label === value).at(0);
                    return {
                        ...a,
                        label: value,
                        value: defaultValueForVariable(newVariable),
                        operation: newVariable?.type === 'number' ? a.operation : '='
                    };
                }
                // Pour les autres champs, on garde le type et on met à jour le champ
                return { ...a, [field]: value } as TriggerAction;
            })} : t
        ));
        setIsSaved(false);
    }

    return {
        currentId,
        setCurrentId,
        current,
        // ---
        onFieldChange,
        onAddGroup,
        onAddCondition,
        onRemoveGroup,
        onRemoveCondition,
        onDataChange,
        onAddParagraph,
        onAddImage,
        onAddAssignment,
        onRemoveAssignment,
        onAssignmentChanged,
        onVariableChange,
        onAddVariable,
        onRemoveVariable,
        // ---
        onAddTrigger,
        onRemoveTrigger,
        onTriggerConditionsChanged,
        onTriggerAddGroup,
        onTriggerAddCondition,
        onTriggerRemoveGroup,
        onTriggerRemoveCondition,
        onAddAction,
        onRemoveAction,
        onActionChanged
    }
}