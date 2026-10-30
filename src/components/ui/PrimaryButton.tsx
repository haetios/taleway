'use client'

import { Icon } from "@iconify/react"
import Link from "next/link"

export default function PrimaryButton(
    {
        content,
        href,
        onClick,
        className,
        icon,
        iconPosition = 'left'
    }:
    {
        content: string,
        href?: string,
        onClick?: () => void,
        className?: string,
        icon?: string,
        iconPosition?: 'left'|'right'
    }
) {
    if (href) {
        return (
            <Link href={href} className={`bg-primary text-surface rounded p-2 font-bold ${className}`}>
                {iconPosition == 'left' && icon && <Icon icon={icon} />}
                {content}
                {iconPosition == 'right' && icon && <Icon icon={icon} />}
            </Link>
        )
    }

    return (
        <button className={`bg-primary text-surface rounded p-2 hover:cursor-pointer font-bold ${className}`} onClick={onClick}>
            {iconPosition == 'left' && icon && <Icon icon={icon} />}
            {content}
            {iconPosition == 'right' && icon && <Icon icon={icon} />}
        </button>
    )
}