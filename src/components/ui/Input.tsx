'use client'

export default function Input(
    {
        placeholder,
        value,
        className
    }:
    {
        placeholder?: string
        value?: string
        className?: string
    }
) {
    return (
        <input placeholder={placeholder} value={value} className={`bg-input p-2 rounded border border-border ${className}`} />
    )
}