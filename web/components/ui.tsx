import Image from 'next/image'
import styles from './ui.module.css'

/**
 * The app's card vocabulary, rebuilt for the web.
 *
 * Rebuilt rather than screenshotted, on purpose: these cards have to animate, respond to a
 * cursor and stay sharp at display size, none of which a PNG does. The cost is that this is a
 * second implementation which could drift from `mobile/components/ui.tsx` — the generated
 * tokens are what keep it honest, so every value here comes from a `var(--…)` and never from
 * a literal.
 *
 * House rules carried over from docs/design/kept-design-system.md:
 *   · Cards are lifted with light, never outlined. Borders only separate rows inside a card.
 *   · At most one 3D object per card, and it is the moment, not the furniture.
 *   · One sentence of supporting copy, or none.
 *   · Numbers are the headline. Words are the caption.
 */

type Tone = 'kiwi' | 'grape' | 'coral' | 'sky' | 'sun' | 'neutral'

/**
 * Extra props are forwarded to the element.
 *
 * Without the spread, a `data-*` attribute passed to `<Card>` is silently dropped — the prop
 * is destructured into nothing and no error is raised anywhere. A stylesheet keyed on that
 * attribute then simply never matches, and the component looks like it is working because
 * its default state is the one you see first. That is how the privacy card's two views were
 * both rendering as one view.
 */
export function Card({
  children,
  tone,
  flat,
  className,
  as: Tag = 'div',
  ...rest
}: React.HTMLAttributes<HTMLElement> & {
  children: React.ReactNode
  tone?: Tone
  flat?: boolean
  className?: string
  as?: 'div' | 'article' | 'li'
}) {
  return (
    <Tag
      {...rest}
      className={[styles.card, flat ? styles.flat : '', tone ? styles[tone] : '', className]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </Tag>
  )
}

export function Chip({ label, tone = 'neutral' }: { label: string; tone?: Tone }) {
  return <span className={`${styles.chip} ${styles[`chip_${tone}`]}`}>{label}</span>
}

/** A number as the headline, its meaning as the caption — never the other way round. */
export function Stat({ value, caption, tone }: { value: string; caption: string; tone?: Tone }) {
  return (
    <div className={styles.stat}>
      <span className={`${styles.statValue} numeric`} style={tone ? { color: `var(--${tone})` } : undefined}>
        {value}
      </span>
      <span className={styles.statCaption}>{caption}</span>
    </div>
  )
}

export const OBJECT_NAMES = [
  'banknote',
  'bell',
  'calendar',
  'chart-up',
  'check',
  'coin',
  'fire',
  'gift',
  'handshake',
  'locked',
  'money-bag',
  'party',
  'people',
  'potted-plant',
  'rocket',
  'seedling',
  'shield',
  'star',
  'target',
  'trophy',
] as const

export type ObjectName = (typeof OBJECT_NAMES)[number]

/**
 * The app's own 3D objects — Microsoft's Fluent Emoji set, the same files the product ships,
 * so an award on this page is visibly the award in your hand.
 */
export function Object3D({
  name,
  size = 64,
  className,
  dim,
}: {
  name: ObjectName
  size?: number
  className?: string
  dim?: boolean
}) {
  return (
    <Image
      src={`/3d/${name}.png`}
      alt=""
      width={size}
      height={size}
      className={[styles.object, dim ? styles.objectDim : '', className].filter(Boolean).join(' ')}
      style={{ width: size, height: size }}
    />
  )
}

/** The object on a tinted disc — for when it has to hold its own against a white card. */
export function ObjectSpot({
  name,
  tone = 'kiwi',
  size = 96,
}: {
  name: ObjectName
  tone?: Tone
  size?: number
}) {
  return (
    <span
      className={`${styles.spot} ${styles[`spot_${tone}`]}`}
      style={{ width: size, height: size, borderRadius: size / 2 }}
    >
      <Object3D name={name} size={Math.round(size * 0.62)} />
    </span>
  )
}

/** A phone-shaped frame, for the few places a card should read as being *in* the product. */
export function Device({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={[styles.device, className].filter(Boolean).join(' ')} aria-hidden="true">
      <div className={styles.deviceScreen}>{children}</div>
    </div>
  )
}
