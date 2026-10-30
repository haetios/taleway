/**
 * Divider : ligne de séparation horizontale, avec label optionnel centré
 * entre deux segments. Ex : <Divider label="ou" className="w-80" />
 */
export default function Divider(
    {
        label,
        className
    }:
    {
        /** Texte affiché au centre (ex : "ou") ; absent = simple ligne */
        label?: string,
        className?: string
    }
) {
    if (label) {
        return (
            <div className={`flex items-center gap-3 ${className ?? ''}`} role="separator">
                <span className="h-px flex-1 bg-border" aria-hidden="true" />
                <span className="text-muted text-sm whitespace-nowrap">{label}</span>
                <span className="h-px flex-1 bg-border" aria-hidden="true" />
            </div>
        )
    }

    return (
        <hr className={`h-px border-0 bg-border ${className ?? ''}`} />
    )
}