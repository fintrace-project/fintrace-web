import { InitialsAvatar } from '@/components/cards'
import { accentOf } from '@/lib/accent'
import { ENTITY_ICONS } from '@/lib/entity-icons'
import { cn } from '@/lib/utils'

// What an account and a category have in common for showing one
export interface Iconed {
  id: string
  name: string
  icon?: string | null
}

// Its icon on its own colour, or its initials while it has no icon from the set
export function EntityIcon({ entity, className }: { entity: Iconed; className?: string }) {
  const icon = entity.icon ? ENTITY_ICONS.get(entity.icon) : undefined
  if (!icon) {
    return <InitialsAvatar name={entity.name} colorId={entity.id} className={className} />
  }
  return (
    <span
      aria-hidden
      style={accentOf(entity.id)}
      className={cn(
        'flex size-9 shrink-0 items-center justify-center rounded-[10px] bg-(--ws-soft) text-(--ws) [&>svg]:size-[55%]',
        className,
      )}
    >
      {icon}
    </span>
  )
}
