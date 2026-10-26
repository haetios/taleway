import { Variable } from "@/types";
import { Icon } from "@iconify/react";

interface VariablePanelProps {
    variables: Variable[]
    onAddVariable: () => void
    onRemoveVariable: (index: number) => void
    onVariableChange: (index: number, field: keyof Variable, value: string | boolean | number) => void
}

export default function VariablePanel({ variables, onAddVariable, onRemoveVariable, onVariableChange }: VariablePanelProps) {

    return (
        <div className="relative h-full">
            <h2 className="text-center text-xl font-bold mb-8">Story State</h2>
            <div className="flex flex-col gap-2">
                { variables.map((variable, index) => (
                    <div key={index} className="grid grid-cols-12 gap-4 items-center">
                        <button className="cursor-pointer h-10 w-10 flex items-center justify-center hover:bg-gray-100 py-1" onClick={() => onRemoveVariable(index)}>
                            <Icon icon="mdi:trash-can" className="text-red-500" />
                        </button>
                        <input
                            className={
                                `col-span-3 input-primary
                                ${variable.label ? '' : 'border-red-500'}
                                ${variables.filter((v) => variable.label === v.label).length > 1 ? 'border-red-500' : ''}`
                            }
                            value={variable.label}
                            onChange={(e) => onVariableChange(index, 'label', e.currentTarget.value)} />
                        <span className="col-span-1">:</span>
                        <select
                            className="col-span-2 input-primary"
                            value={variable.type}
                            onChange={(e) => {
                                const newType = e.currentTarget.value;
                                const defaultValue = newType === 'boolean' ? true : newType === 'number' ? 0 : '';
                                onVariableChange(index, 'type', newType);
                                onVariableChange(index, 'value', defaultValue);
                            }}
                        >
                            <option value="text">text</option>
                            <option value="boolean">boolean</option>
                            <option value="number">number</option>
                        </select>
                        <span className="col-span-1">=</span>
                        {
                            variable.type === 'boolean' ?
                                <select
                                    className="col-span-3 input-primary"
                                    value={String(variable.value)}
                                    onChange={(e) => onVariableChange(index, 'value', e.currentTarget.value === 'true')}
                                >
                                    <option value="true">true</option>
                                    <option value="false">false</option>
                                </select>
                            :
                                <input
                                    type={variable.type}
                                    className="col-span-3 input-primary"
                                    value={variable.type === 'number' ? (isNaN(Number(variable.value)) ? 0 : Number(variable.value)) : String(variable.value)}
                                    onChange={(e) => onVariableChange(index, 'value', e.currentTarget.value)}
                                />
                        }
                    </div>
                ))}
            </div>
            <div className="absolute bottom-0 right-0 grid grid-cols-12 w-full">
                <div className="col-span-4"></div>
                <div className="col-span-4"></div>
                <button className="btn-primary flex gap-2 items-center col-span-4 justify-center" onClick={() => onAddVariable()}>
                    <Icon icon="mdi:plus-circle-outline" className="size-5" />
                    <span className="text-sm">Variable</span>
                </button>
            </div>
        </div>
    )
}