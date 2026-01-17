import { TouchableOpacity } from 'react-native'
import type { ReactNode } from 'react'
import { haptics } from '@/services/haptics'

type IconButtonVariant = 'default' | 'accent' | 'ghost'
type IconButtonSize = 'sm' | 'md' | 'lg'

interface IconButtonProps {
  icon: ReactNode
  onPress?: () => void
  variant?: IconButtonVariant
  size?: IconButtonSize
  disabled?: boolean
  className?: string
}

const sizeClasses: Record<IconButtonSize, string> = {
  sm: 'h-8 w-8',
  md: 'h-10 w-10',
  lg: 'h-12 w-12',
}

const variantClasses: Record<IconButtonVariant, string> = {
  default: 'bg-card',
  accent: 'bg-accent',
  ghost: 'bg-transparent',
}

export function IconButton({
  icon,
  onPress,
  variant = 'default',
  size = 'md',
  disabled = false,
  className = '',
}: IconButtonProps) {
  const handlePress = () => {
    if (!disabled) {
      haptics.light()
      onPress?.()
    }
  }

  return (
    <TouchableOpacity
      className={`items-center justify-center rounded-full ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
      onPress={handlePress}
      disabled={disabled}
      style={{ opacity: disabled ? 0.5 : 1 }}
    >
      {icon}
    </TouchableOpacity>
  )
}
