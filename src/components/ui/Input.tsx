'use client'

import { InputHTMLAttributes } from "react"

export default function Input(
    {
        className,
        ...props
    }: InputHTMLAttributes<HTMLInputElement>
) {
    return (
        <input
            {...props}
            className={`bg-input p-2 rounded border border-border ${className}`}
        />
    )
}