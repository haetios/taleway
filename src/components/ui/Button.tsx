'use client'

import { Icon } from '@iconify/react'
import Link from 'next/link'

export default function Button(
    {
        type,
        content,
        href,
        onClick,
        className,
        icon,
        iconPosition = 'left',
        iconSize = 16
    }:
    {
        type: 'primary'|'secondary'
        content: string,
        href?: string,
        onClick?: () => void,
        className?: string,
        icon?: string
        iconPosition?: 'left'|'right',
        iconSize?: number
    }
) {
    if (href) {
        return (
            <Link href={href} className={
                `flex items-center rounded p-2 hover:cursor-pointer font-bold
                ${type === 'secondary' && 'border border-border bg-surface'}
                ${type === 'primary' && 'bg-primary text-surface'}
                ${className}`
            }>
                {iconPosition == 'left' && icon && <Icon icon={icon} className='mr-2 w-10' fontSize={iconSize} />}
                {content}
                {iconPosition == 'right' && icon && <Icon icon={icon} className='mr-2 w-10' fontSize={iconSize} />}
            </Link>
        )
    }

    return (
        <button onClick={onClick} className={
            `flex items-center rounded p-2 hover:cursor-pointer font-bold
            ${type === 'secondary' && 'border border-border bg-surface'}
            ${type === 'primary' && 'justify-center bg-primary text-surface'}
            ${className}`
        }>
            {iconPosition == 'left' && icon && <Icon icon={icon} className='mr-2 w-10' fontSize={iconSize} />}
            {content}
            {iconPosition == 'right' && icon && <Icon icon={icon} className='mr-2 w-10' fontSize={iconSize} />}
        </button>
    )
}