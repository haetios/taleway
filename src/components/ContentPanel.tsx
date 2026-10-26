import { Assignment, Condition, ConditionGroup, ContentItem, EdgeData, NodeData, StoryEdge, StoryNode, Variable } from "@/types"
import { Icon } from "@iconify/react"
import { isEdge, isNode } from "@xyflow/react"
import { DragDropProvider, type DragEndEvent } from "@dnd-kit/react"
import SortableContentItem from "./SortableContentItem"
import { defaultValueForVariable } from "@/composables/usePanelContent"
import { useState } from "react"

interface ContentPanelProps {
    element: StoryNode|StoryEdge|undefined
    variables: Variable[]

    onDataChange: (field: keyof NodeData|keyof EdgeData, value: string|ContentItem[]|ConditionGroup[]|Assignment[]) => void
    onFieldChange: (field: keyof StoryNode|keyof StoryEdge, value: string) => void
    onAddParagraph: () => void
    onAddImage: () => void

    onAddGroup: () => void
    onAddCondition: (groupIndex: number) => void
    onRemoveGroup: (groupIndex: number) => void
    onRemoveCondition: (groupIndex: number, conditionIndex: number) => void

    onAddAssignment: () => void
    onRemoveAssignment: (index: number) => void
    onAssignmentChanged: (index: number, field: keyof Assignment, value: string) => void
}

export default function ContentPanel ({
    element,
    variables,
    onDataChange,
    onAddParagraph,
    onAddImage,
    onFieldChange,
    onAddGroup,
    onAddCondition,
    onRemoveGroup,
    onRemoveCondition,
    onAddAssignment,
    onRemoveAssignment,
    onAssignmentChanged
}: ContentPanelProps) {
    const [edgeTab, setEdgeTab] = useState<'conditions' | 'assignments'>('conditions')

    if (!element) return (
        <div className="flex h-full justify-center items-center">
            <p>Select a node or an edge to edit its content</p>
        </div>
    )

    const getVariableByLabel = (label: string) => {
        return variables.filter((v) => label === v.label).at(0);
    }

    const onConditionsChanged = (groupIndex: number, conditionIndex: number, field: keyof Condition, value: string) => {
        if (!isEdge(element)) return;
        const newGroups = element.data.conditionGroups.map((g, gi) =>
            gi === groupIndex
                ? { ...g, conditions: g.conditions.map((c, ci) => {
                    if (ci !== conditionIndex) return c;
                    // Quand on change la variable, on réinitialise valeur et opération selon son type
                    if (field === 'label') {
                        const newVariable = getVariableByLabel(value);
                        return {
                            ...c,
                            label: value,
                            value: defaultValueForVariable(newVariable),
                            // Les opérateurs de comparaison ne sont valables que sur les nombres
                            operation: newVariable?.type === 'number' || !['>', '>=', '<', '<='].includes(c.operation) ? c.operation : '=='
                        };
                    }
                    return { ...c, [field]: value };
                  })}
                : g
        );
        onDataChange('conditionGroups', newGroups)
    }

    const onContentChanged = (index: number, newContent: string) => {
        if (!isNode(element)) return;
        const els = element.data.content.map((c, i) => i === index ? { ...c, content: newContent } : c);
        onDataChange('content', els)
    }

    const onContentRemoved = (index: number) => {
        if (!isNode(element)) return;
        const newContentArray = element.data.content.filter((_, i) => i !== index)
        onDataChange('content', newContentArray)
    }

    const handleDragEnd = (event: DragEndEvent) => {
        if (!isNode(element)) return;
        const { source, target } = event.operation;
        if (!source || !target) return;

        const fromIndex = (source as any).index;
        const toIndex = (target as any).index;
        if (fromIndex === undefined || toIndex === undefined) return;
        if (fromIndex === toIndex) return;

        const newContent = [...element.data.content];
        const [moved] = newContent.splice(fromIndex, 1);
        newContent.splice(toIndex, 0, moved);
        onDataChange('content', newContent);
    }

    return (
        <div className="relative h-full">
            <input
                type="text"
                value={isNode(element) ? (element.data.label as string ?? '') : (element.label as string ?? '')}
                onChange={(e) => isNode(element) ? onDataChange('label', e.currentTarget.value) : onFieldChange('label', e.currentTarget.value)}
                className="mb-10 focus:outline-none focus:border focus:border-black hover:border hover:border-black border border-transparent rounded-lg focus:border-b text-xl w-full p-1 text-center"
                placeholder="Label"
                required
            />

            <div className="flex flex-col gap-4">
                { isNode(element) && (
                    <DragDropProvider onDragEnd={handleDragEnd}>
                        {element.data.content.map((c, index) => {
                            const id = c.id;

                            if (c.type === 'paragraph') return (
                                <SortableContentItem key={id} id={id} index={index} onRemove={() => onContentRemoved(index)}>
                                    <textarea
                                        ref={(el) => {
                                            if (el) {
                                                el.style.height = 'auto';
                                                el.style.height = `${el.scrollHeight}px`;
                                            }
                                        }}
                                        className={`hover:border min-h-20 hover:border-black w-full resize-none textarea-primary overflow-hidden ${
                                            c.content ? 'border-transparent' : 'border'
                                        }`}
                                        value={c.content}
                                        onChange={(e) => onContentChanged(index, e.currentTarget.value)}
                                    />
                                </SortableContentItem>
                            )

                            if (c.type === 'image') return (
                                <SortableContentItem key={id} id={id} index={index} onRemove={() => onContentRemoved(index)}>
                                    <div className="relative group overflow-hidden object-cover rounded flex justify-center items-center">
                                        {c.content && (
                                            <>
                                                <img src={c.content} className="relative w-full object-cover rounded" />
                                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors rounded" />
                                            </>
                                        )}
                                        {!c.content && (
                                            <div className="relative h-50 w-full bg-gray-100 rounded flex items-center justify-center">
                                                <span className="text-gray-400 text-sm">No image</span>
                                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors rounded" />
                                            </div>
                                        )}
                                        <label htmlFor={`image-${id}`} className="hidden group-hover:flex cursor-pointer absolute hover:bg-gray-100 p-2 items-center justify-center rounded-full gap-2 h-10 w-10">
                                            <Icon icon="mdi:upload" className="size-10" />
                                        </label>
                                        <input
                                            id={`image-${id}`}
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={(e) => {
                                                const file = e.target.files?.[0]
                                                if (!file) return
                                                if (file.size > 2 * 1024 * 1024) {
                                                    alert('Image trop lourde (max 2MB)')
                                                    return
                                                }
                                                const reader = new FileReader()
                                                reader.onload = () => onContentChanged(index, reader.result as string)
                                                reader.readAsDataURL(file)
                                            }}
                                        />
                                    </div>
                                </SortableContentItem>
                            )

                            // TODO: Sound/Music
                        })}
                    </DragDropProvider>
                )}

                { isEdge(element) && (
                    <>
                        {/* Tab menu */}
                        <div className="flex mb-4 border-b">
                            <button
                                className={`cursor-pointer flex-1 py-2 text-sm font-bold border-b-2 ${edgeTab === 'conditions' ? 'border-black' : 'text-gray-400 border-transparent'}`}
                                onClick={() => setEdgeTab('conditions')}
                            >
                                Conditions
                            </button>
                            <button
                                className={`cursor-pointer flex-1 py-2 text-sm font-bold ${edgeTab === 'assignments' ? 'border-b-2 border-black' : 'text-gray-400'}`}
                                onClick={() => setEdgeTab('assignments')}
                            >
                                Affectations
                            </button>
                        </div>

                        {/* Conditions tab */}
                        {edgeTab === 'conditions' && element.data.conditionGroups.map((group, groupIndex) => (
                    <div key={groupIndex}>
                        { groupIndex > 0 && (
                            <div className="flex items-center gap-2 mb-4">
                                <div className="flex-1 h-px bg-gray-300"></div>
                                <span className="font-bold text-gray-500">OR</span>
                                <div className="flex-1 h-px bg-gray-300"></div>
                            </div>
                        )}
                        <div className="flex flex-col gap-2 p-2 border rounded-lg relative min-h-24">
                            <div className="flex items-center justify-end">
                                <button className="cursor-pointer flex items-center h-8 w-8 justify-center hover:bg-gray-100" onClick={() => onRemoveGroup(groupIndex)}>
                                    <Icon icon="mdi:trash-can" className="text-red-500" />
                                </button>
                            </div>

                        { group.conditions.map((c, conditionIndex) => (
                            <div key={conditionIndex} className="relative flex gap-2 items-center">
                                <button className="cursor-pointer flex items-center h-8 w-8 justify-center hover:bg-gray-100" onClick={() => onRemoveCondition(groupIndex, conditionIndex)}>
                                    <Icon icon="mdi:trash-can" className="text-red-500" />
                                </button>
                                <select
                                    className="input-primary"
                                    value={c.label}
                                    onChange={(e) => onConditionsChanged(groupIndex, conditionIndex, 'label', e.currentTarget.value)}
                                >
                                    { variables.map((v, vi) => (
                                        <option key={vi} value={v.label}>{v.label}</option>
                                    ))}
                                </select>

                                <select
                                    className="input-primary"
                                    value={c.operation}
                                    onChange={(e) => onConditionsChanged(groupIndex, conditionIndex, 'operation', e.currentTarget.value)}
                                >
                                    <option value='=='>equal to</option>
                                    <option value='!='>different to</option>
                                    { getVariableByLabel(c.label)?.type === 'number' &&
                                        <>
                                            <option value='>'>higher than</option>
                                            <option value='>='>higher or equal than</option>
                                            <option value='<'>lower than</option>
                                            <option value='<='>lower or equal than</option>
                                        </>
                                    }
                                </select>

                                { getVariableByLabel(c.label)?.type === 'boolean' &&
                                    <select
                                        className="input-primary"
                                        value={c.value}
                                        onChange={(e) => onConditionsChanged(groupIndex, conditionIndex, 'value', e.currentTarget.value)}
                                    >
                                        <option value='true'>true</option>
                                        <option value='false'>false</option>
                                    </select>
                                }
                                { getVariableByLabel(c.label)?.type !== 'boolean' && getVariableByLabel(c.label)?.type !== undefined &&
                                    <input
                                        className="input-primary"
                                        type={getVariableByLabel(c.label)?.type}
                                        value={c.value}
                                        onChange={(e) => onConditionsChanged(groupIndex, conditionIndex, 'value', e.currentTarget.value)}
                                    />
                                }
                            </div>
                        ))}

                            <div className="absolute bottom-0 right-0 m-2">
                                <button className={`${variables.filter((v) => v.label !== '').length > 0 ? 'btn-primary' : 'btn-primary-disabled'} flex gap-2 items-center justify-center`} onClick={() => onAddCondition(groupIndex)}>
                                    <Icon icon="mdi:plus-circle-outline" className="size-5" />
                                    <span className="text-sm">Condition</span>
                                </button>
                            </div>
                        </div>
                    </div>
                ))}

                        {/* Assignments tab */}
                        {edgeTab === 'assignments' && (
                            <div className="flex flex-col gap-2">
                                {(element.data.assignments ?? []).map((a, index) => (
                                    <div key={index} className="flex gap-2 items-center">
                                        <button className="cursor-pointer flex items-center h-8 w-8 justify-center hover:bg-gray-100" onClick={() => onRemoveAssignment(index)}>
                                            <Icon icon="mdi:trash-can" className="text-red-500" />
                                        </button>
                                        <select
                                            className="input-primary"
                                            value={a.label}
                                            onChange={(e) => onAssignmentChanged(index, 'label', e.currentTarget.value)}
                                        >
                                            {variables.map((v, vi) => (
                                                <option key={vi} value={v.label}>{v.label}</option>
                                            ))}
                                        </select>

                                        <select
                                            className="input-primary"
                                            value={a.operation}
                                            onChange={(e) => onAssignmentChanged(index, 'operation', e.currentTarget.value)}
                                        >
                                            <option value="=">set to</option>
                                            {getVariableByLabel(a.label)?.type === 'number' && (
                                                <>
                                                    <option value="+=">add</option>
                                                    <option value="-=">subtract</option>
                                                </>
                                            )}
                                        </select>

                                        {getVariableByLabel(a.label)?.type === 'boolean' && (
                                            <select
                                                className="input-primary"
                                                value={a.value}
                                                onChange={(e) => onAssignmentChanged(index, 'value', e.currentTarget.value)}
                                            >
                                                <option value="true">true</option>
                                                <option value="false">false</option>
                                            </select>
                                        )}
                                        {getVariableByLabel(a.label)?.type !== 'boolean' && getVariableByLabel(a.label)?.type !== undefined && (
                                            <input
                                                className="input-primary"
                                                type={getVariableByLabel(a.label)?.type}
                                                value={a.value}
                                                onChange={(e) => onAssignmentChanged(index, 'value', e.currentTarget.value)}
                                            />
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>
            { isNode(element) &&
                <div className="absolute bottom-0 right-0 grid gap-2 grid-cols-12 w-full">
                    <button
                        className="btn-primary flex gap-2 items-center col-span-4 justify-center"
                        onClick={onAddParagraph}
                    >
                        <Icon icon="mdi:plus-circle-outline" className="size-5" />
                        <span className="text-sm">Paragraph</span>
                    </button>
                    <button
                        className="btn-primary flex gap-2 items-center col-span-4 justify-center"
                        onClick={onAddImage}
                    >
                        <Icon icon="mdi:plus-circle-outline" className="size-5" />
                        <span className="text-xs">Image</span>
                    </button>
                    <button className="btn-primary-disabled flex gap-2 items-center col-span-4 justify-center">
                        <Icon icon="mdi:plus-circle-outline" className="size-5" />
                        <span className="text-xs">Sound / Music</span>
                    </button>
                </div>
            }
            { isEdge(element) &&
                <div className="absolute bottom-0 right-0 grid grid-cols-12 w-full">
                    <div className="col-span-4"></div>
                    <div className="col-span-4"></div>
                    {edgeTab === 'conditions' ? (
                        <button className={`${variables.filter((v) => v.label !== '').length > 0 ? 'btn-primary' : 'btn-primary-disabled'} flex gap-2 items-center col-span-4 justify-center`} onClick={onAddGroup}>
                            <Icon icon="mdi:plus-circle-outline" className="size-5" />
                            <span className="text-sm">Group</span>
                        </button>
                    ) : (
                        <button className={`${variables.filter((v) => v.label !== '').length > 0 ? 'btn-primary' : 'btn-primary-disabled'} flex gap-2 items-center col-span-4 justify-center`} onClick={onAddAssignment}>
                            <Icon icon="mdi:plus-circle-outline" className="size-5" />
                            <span className="text-sm">Affectation</span>
                        </button>
                    )}
                </div>
            }
        </div>
    )
}