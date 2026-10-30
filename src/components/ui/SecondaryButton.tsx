'use client'

import { Icon } from '@iconify/react'
import Link from 'next/link'

export default function PrimaryButton(
    {
        content,
        href,
        onClick,
        className,
        icon,
        iconPosition = 'left',
        iconSize = 16
    }:
    {
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
            <Link href={href} className={`flex items-center border border-border bg-surface rounded p-2 font-bold ${className}`}>
                {iconPosition == 'left' && icon && <Icon icon={icon} className='mr-2' fontSize={iconSize} />}
                {content}
                {iconPosition == 'right' && icon && <Icon icon={icon} className='mr-2' fontSize={iconSize} />}
            </Link>
        )
    }

    return (
        <button className={`flex items-center border border-border bg-surface rounded p-2 hover:cursor-pointer font-bold ${className}`} onClick={onClick}>
            {iconPosition == 'left' && icon && <Icon icon={icon} className='mr-2' fontSize={iconSize} />}
            {content}
            {iconPosition == 'right' && icon && <Icon icon={icon} className='mr-2' fontSize={iconSize} />}
        </button>
    )
}