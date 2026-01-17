import { Ionicons } from '@expo/vector-icons'
import { colors } from '@/theme/colors'

type IconSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

const iconSizes: Record<IconSize, number> = {
  xs: 12,
  sm: 16,
  md: 20,
  lg: 24,
  xl: 32,
}

interface BaseIconProps {
  size?: IconSize | number
  color?: string
  className?: string
}

// Navigation Icons
export const ChevronBackIcon = ({
  size = 'lg',
  color = colors.text.primary,
}: BaseIconProps) => (
  <Ionicons
    name="chevron-back"
    size={typeof size === 'number' ? size : iconSizes[size]}
    color={color}
  />
)

export const ChevronForwardIcon = ({
  size = 'lg',
  color = colors.text.muted,
}: BaseIconProps) => (
  <Ionicons
    name="chevron-forward"
    size={typeof size === 'number' ? size : iconSizes[size]}
    color={color}
  />
)

export const ChevronRightIcon = ({
  size = 'md',
  color = colors.text.muted,
}: BaseIconProps) => (
  <Ionicons
    name="chevron-forward"
    size={typeof size === 'number' ? size : iconSizes[size]}
    color={color}
  />
)

export const CloseIcon = ({
  size = 'lg',
  color = colors.text.primary,
}: BaseIconProps) => (
  <Ionicons
    name="close"
    size={typeof size === 'number' ? size : iconSizes[size]}
    color={color}
  />
)

// Location & Navigation
export const LocationIcon = ({
  size = 'md',
  color = colors.accent.DEFAULT,
}: BaseIconProps) => (
  <Ionicons
    name="location"
    size={typeof size === 'number' ? size : iconSizes[size]}
    color={color}
  />
)

export const LocationOutlineIcon = ({
  size = 'sm',
  color = colors.text.muted,
}: BaseIconProps) => (
  <Ionicons
    name="location-outline"
    size={typeof size === 'number' ? size : iconSizes[size]}
    color={color}
  />
)

export const NavigateIcon = ({
  size = 'md',
  color = colors.accent.DEFAULT,
}: BaseIconProps) => (
  <Ionicons
    name="navigate"
    size={typeof size === 'number' ? size : iconSizes[size]}
    color={color}
  />
)

export const NavigateOutlineIcon = ({
  size = 'sm',
  color = colors.accent.DEFAULT,
}: BaseIconProps) => (
  <Ionicons
    name="navigate-outline"
    size={typeof size === 'number' ? size : iconSizes[size]}
    color={color}
  />
)

export const CompassOutlineIcon = ({
  size = 'xs',
  color = colors.icon.info,
}: BaseIconProps) => (
  <Ionicons
    name="compass-outline"
    size={typeof size === 'number' ? size : iconSizes[size]}
    color={color}
  />
)

// Walking & Approach
export const WalkIcon = ({
  size = 'lg',
  color = colors.icon.navigation,
}: BaseIconProps) => (
  <Ionicons
    name="walk"
    size={typeof size === 'number' ? size : iconSizes[size]}
    color={color}
  />
)

export const WalkOutlineIcon = ({
  size = 'xs',
  color = colors.icon.walk,
}: BaseIconProps) => (
  <Ionicons
    name="walk-outline"
    size={typeof size === 'number' ? size : iconSizes[size]}
    color={color}
  />
)

export const FootstepsIcon = ({
  size = 'lg',
  color = colors.icon.approach,
}: BaseIconProps) => (
  <Ionicons
    name="footsteps"
    size={typeof size === 'number' ? size : iconSizes[size]}
    color={color}
  />
)

// Route & Climbing Info
export const ResizeOutlineIcon = ({
  size = 'xs',
  color = colors.text.muted,
}: BaseIconProps) => (
  <Ionicons
    name="resize-outline"
    size={typeof size === 'number' ? size : iconSizes[size]}
    color={color}
  />
)

export const FlashIcon = ({
  size = 'xs',
  color = colors.text.muted,
}: BaseIconProps) => (
  <Ionicons
    name="flash"
    size={typeof size === 'number' ? size : iconSizes[size]}
    color={color}
  />
)

export const EllipseIcon = ({
  size = 10,
  color = colors.text.muted,
}: BaseIconProps) => (
  <Ionicons
    name="ellipse"
    size={typeof size === 'number' ? size : iconSizes.xs}
    color={color}
  />
)

export const LayersOutlineIcon = ({
  size = 'xs',
  color = colors.text.muted,
}: BaseIconProps) => (
  <Ionicons
    name="layers-outline"
    size={typeof size === 'number' ? size : iconSizes[size]}
    color={color}
  />
)

export const BarChartOutlineIcon = ({
  size = 'md',
  color = colors.accent.DEFAULT,
}: BaseIconProps) => (
  <Ionicons
    name="bar-chart-outline"
    size={typeof size === 'number' ? size : iconSizes[size]}
    color={color}
  />
)

// Stars & Quality
export const StarIcon = ({
  size = 'sm',
  color = colors.grade.medium,
}: BaseIconProps) => (
  <Ionicons
    name="star"
    size={typeof size === 'number' ? size : iconSizes[size]}
    color={color}
  />
)

export const TrophyIcon = ({
  size = 'xs',
  color = colors.grade.easy,
}: BaseIconProps) => (
  <Ionicons
    name="trophy"
    size={typeof size === 'number' ? size : iconSizes[size]}
    color={color}
  />
)

// Warnings & Alerts
export const WarningIcon = ({
  size = 'sm',
  color = colors.orange.DEFAULT,
}: BaseIconProps) => (
  <Ionicons
    name="warning"
    size={typeof size === 'number' ? size : iconSizes[size]}
    color={color}
  />
)

export const AlertIcon = ({
  size = 'md',
  color = colors.orange.DEFAULT,
}: BaseIconProps) => (
  <Ionicons
    name="alert"
    size={typeof size === 'number' ? size : iconSizes[size]}
    color={color}
  />
)

export const AlertCircleOutlineIcon = ({
  size = 'xl',
  color = colors.grade.hard,
}: BaseIconProps) => (
  <Ionicons
    name="alert-circle-outline"
    size={typeof size === 'number' ? size : iconSizes[size]}
    color={color}
  />
)

// Equipment & Protection
export const ShieldCheckmarkIcon = ({
  size = 'md',
  color = colors.grade.easy,
}: BaseIconProps) => (
  <Ionicons
    name="shield-checkmark"
    size={typeof size === 'number' ? size : iconSizes[size]}
    color={color}
  />
)

export const ConstructIcon = ({
  size = 'sm',
  color = colors.orange.DEFAULT,
}: BaseIconProps) => (
  <Ionicons
    name="construct"
    size={typeof size === 'number' ? size : iconSizes[size]}
    color={color}
  />
)

export const FitnessOutlineIcon = ({
  size = 'xs',
  color = colors.orange.DEFAULT,
}: BaseIconProps) => (
  <Ionicons
    name="fitness-outline"
    size={typeof size === 'number' ? size : iconSizes[size]}
    color={color}
  />
)

// Images & Media
export const ImageOutlineIcon = ({
  size = 'xl',
  color = colors.text.muted,
}: BaseIconProps) => (
  <Ionicons
    name="image-outline"
    size={typeof size === 'number' ? size : iconSizes[size]}
    color={color}
  />
)

export const ImagesOutlineIcon = ({
  size = 'xs',
  color = colors.text.secondary,
}: BaseIconProps) => (
  <Ionicons
    name="images-outline"
    size={typeof size === 'number' ? size : iconSizes[size]}
    color={color}
  />
)

export const ScanOutlineIcon = ({
  size = 'md',
  color = colors.text.primary,
}: BaseIconProps) => (
  <Ionicons
    name="scan-outline"
    size={typeof size === 'number' ? size : iconSizes[size]}
    color={color}
  />
)

export const ExpandOutlineIcon = ({
  size = 'md',
  color = colors.text.primary,
}: BaseIconProps) => (
  <Ionicons
    name="expand-outline"
    size={typeof size === 'number' ? size : iconSizes[size]}
    color={color}
  />
)

// Maps & Topos
export const MapOutlineIcon = ({
  size = 'xs',
  color = colors.accent.DEFAULT,
}: BaseIconProps) => (
  <Ionicons
    name="map-outline"
    size={typeof size === 'number' ? size : iconSizes[size]}
    color={color}
  />
)

export const GitBranchOutlineIcon = ({
  size = 'sm',
  color = colors.text.primary,
}: BaseIconProps) => (
  <Ionicons
    name="git-branch-outline"
    size={typeof size === 'number' ? size : iconSizes[size]}
    color={color}
  />
)

// Weather & Conditions
export const ThermometerOutlineIcon = ({
  size = 'sm',
  color = colors.accent.DEFAULT,
}: BaseIconProps) => (
  <Ionicons
    name="thermometer-outline"
    size={typeof size === 'number' ? size : iconSizes[size]}
    color={color}
  />
)

export const FlagOutlineIcon = ({
  size = 'sm',
  color = colors.text.secondary,
}: BaseIconProps) => (
  <Ionicons
    name="flag-outline"
    size={typeof size === 'number' ? size : iconSizes[size]}
    color={color}
  />
)

// Time & Tips
export const TimeOutlineIcon = ({
  size = 'sm',
  color = colors.accent.DEFAULT,
}: BaseIconProps) => (
  <Ionicons
    name="time-outline"
    size={typeof size === 'number' ? size : iconSizes[size]}
    color={color}
  />
)

export const BulbIcon = ({
  size = 'md',
  color = colors.icon.info,
}: BaseIconProps) => (
  <Ionicons
    name="bulb"
    size={typeof size === 'number' ? size : iconSizes[size]}
    color={color}
  />
)

export const TrendingUpOutlineIcon = ({
  size = 'sm',
  color = colors.grade.hard,
}: BaseIconProps) => (
  <Ionicons
    name="trending-up-outline"
    size={typeof size === 'number' ? size : iconSizes[size]}
    color={color}
  />
)

// UI Actions
export const SearchIcon = ({
  size = 'md',
  color = colors.text.primary,
}: BaseIconProps) => (
  <Ionicons
    name="search"
    size={typeof size === 'number' ? size : iconSizes[size]}
    color={color}
  />
)

export const SearchOutlineIcon = ({
  size = 'xl',
  color = colors.text.muted,
}: BaseIconProps) => (
  <Ionicons
    name="search-outline"
    size={typeof size === 'number' ? size : iconSizes[size]}
    color={color}
  />
)

export const OptionsIcon = ({
  size = 'md',
  color = colors.text.primary,
}: BaseIconProps) => (
  <Ionicons
    name="options"
    size={typeof size === 'number' ? size : iconSizes[size]}
    color={color}
  />
)

export const ShareOutlineIcon = ({
  size = 'md',
  color = colors.text.primary,
}: BaseIconProps) => (
  <Ionicons
    name="share-outline"
    size={typeof size === 'number' ? size : iconSizes[size]}
    color={color}
  />
)

export const EllipsisVerticalIcon = ({
  size = 'md',
  color = colors.text.primary,
}: BaseIconProps) => (
  <Ionicons
    name="ellipsis-vertical"
    size={typeof size === 'number' ? size : iconSizes[size]}
    color={color}
  />
)

export const ArrowForwardIcon = ({
  size = 'sm',
  color = colors.text.muted,
}: BaseIconProps) => (
  <Ionicons
    name="arrow-forward"
    size={typeof size === 'number' ? size : iconSizes[size]}
    color={color}
  />
)

// Additional icons
export const StarOutlineIcon = ({
  size = 'xs',
  color = colors.text.muted,
}: BaseIconProps) => (
  <Ionicons
    name="star-outline"
    size={typeof size === 'number' ? size : iconSizes[size]}
    color={color}
  />
)

export const HappyOutlineIcon = ({
  size = 'xs',
  color = colors.grade.easy,
}: BaseIconProps) => (
  <Ionicons
    name="happy-outline"
    size={typeof size === 'number' ? size : iconSizes[size]}
    color={color}
  />
)

export const WarningOutlineIcon = ({
  size = 'xs',
  color = colors.orange.DEFAULT,
}: BaseIconProps) => (
  <Ionicons
    name="warning-outline"
    size={typeof size === 'number' ? size : iconSizes[size]}
    color={color}
  />
)

export const PersonOutlineIcon = ({
  size = 'xs',
  color = colors.text.muted,
}: BaseIconProps) => (
  <Ionicons
    name="person-outline"
    size={typeof size === 'number' ? size : iconSizes[size]}
    color={color}
  />
)

export const PersonIcon = ({
  size = 'xs',
  color = colors.text.muted,
}: BaseIconProps) => (
  <Ionicons
    name="person"
    size={typeof size === 'number' ? size : iconSizes[size]}
    color={color}
  />
)

export const PeopleOutlineIcon = ({
  size = 'xs',
  color = colors.text.muted,
}: BaseIconProps) => (
  <Ionicons
    name="people-outline"
    size={typeof size === 'number' ? size : iconSizes[size]}
    color={color}
  />
)

export const PeopleIcon = ({
  size = 'xs',
  color = colors.text.muted,
}: BaseIconProps) => (
  <Ionicons
    name="people"
    size={typeof size === 'number' ? size : iconSizes[size]}
    color={color}
  />
)

export const SunnyIcon = ({
  size = 'sm',
  color = colors.condition.sol,
}: BaseIconProps) => (
  <Ionicons
    name="sunny"
    size={typeof size === 'number' ? size : iconSizes[size]}
    color={color}
  />
)

export const CloudIcon = ({
  size = 'sm',
  color = colors.condition.sombra,
}: BaseIconProps) => (
  <Ionicons
    name="cloud"
    size={typeof size === 'number' ? size : iconSizes[size]}
    color={color}
  />
)

export const PartlySunnyIcon = ({
  size = 'md',
  color = colors.orange.DEFAULT,
}: BaseIconProps) => (
  <Ionicons
    name="partly-sunny"
    size={typeof size === 'number' ? size : iconSizes[size]}
    color={color}
  />
)

export const CloudyIcon = ({
  size = 'md',
  color = colors.text.secondary,
}: BaseIconProps) => (
  <Ionicons
    name="cloudy"
    size={typeof size === 'number' ? size : iconSizes[size]}
    color={color}
  />
)

export const RainyIcon = ({
  size = 'md',
  color = colors.status.info,
}: BaseIconProps) => (
  <Ionicons
    name="rainy"
    size={typeof size === 'number' ? size : iconSizes[size]}
    color={color}
  />
)

export const ThunderstormIcon = ({
  size = 'md',
  color = colors.status.error,
}: BaseIconProps) => (
  <Ionicons
    name="thunderstorm"
    size={typeof size === 'number' ? size : iconSizes[size]}
    color={color}
  />
)

export const SnowIcon = ({
  size = 'md',
  color = colors.status.info,
}: BaseIconProps) => (
  <Ionicons
    name="snow"
    size={typeof size === 'number' ? size : iconSizes[size]}
    color={color}
  />
)

export const ShieldOutlineIcon = ({
  size = 'md',
  color = colors.text.muted,
}: BaseIconProps) => (
  <Ionicons
    name="shield-outline"
    size={typeof size === 'number' ? size : iconSizes[size]}
    color={color}
  />
)

// Navigation Tab Icons
export const CompassIcon = ({
  size = 'lg',
  color = colors.accent.DEFAULT,
}: BaseIconProps) => (
  <Ionicons
    name="compass"
    size={typeof size === 'number' ? size : iconSizes[size]}
    color={color}
  />
)

export const MapIcon = ({
  size = 'lg',
  color = colors.grade.easy,
}: BaseIconProps) => (
  <Ionicons
    name="map"
    size={typeof size === 'number' ? size : iconSizes[size]}
    color={color}
  />
)

export const BookmarkIcon = ({
  size = 'lg',
  color = colors.grade.medium,
}: BaseIconProps) => (
  <Ionicons
    name="bookmark"
    size={typeof size === 'number' ? size : iconSizes[size]}
    color={color}
  />
)

export const BookmarkOutlineIcon = ({
  size = 'lg',
  color = colors.text.muted,
}: BaseIconProps) => (
  <Ionicons
    name="bookmark-outline"
    size={typeof size === 'number' ? size : iconSizes[size]}
    color={color}
  />
)

// UI Icons
export const HelpCircleOutlineIcon = ({
  size = 'md',
  color = colors.text.secondary,
}: BaseIconProps) => (
  <Ionicons
    name="help-circle-outline"
    size={typeof size === 'number' ? size : iconSizes[size]}
    color={color}
  />
)

export const ListIcon = ({
  size = 'sm',
  color = colors.text.secondary,
}: BaseIconProps) => (
  <Ionicons
    name="list"
    size={typeof size === 'number' ? size : iconSizes[size]}
    color={color}
  />
)

export const FilterIcon = ({
  size = 'md',
  color = colors.text.primary,
}: BaseIconProps) => (
  <Ionicons
    name="filter"
    size={typeof size === 'number' ? size : iconSizes[size]}
    color={color}
  />
)

export const CopyOutlineIcon = ({
  size = 'sm',
  color = colors.text.muted,
}: BaseIconProps) => (
  <Ionicons
    name="copy-outline"
    size={typeof size === 'number' ? size : iconSizes[size]}
    color={color}
  />
)

export const NavigateCircleOutlineIcon = ({
  size = 'md',
  color = colors.text.secondary,
}: BaseIconProps) => (
  <Ionicons
    name="navigate-circle-outline"
    size={typeof size === 'number' ? size : iconSizes[size]}
    color={color}
  />
)

// Checkmark Icons
export const CheckIcon = ({
  size = 'md',
  color = colors.accent.DEFAULT,
}: BaseIconProps) => (
  <Ionicons
    name="checkmark"
    size={typeof size === 'number' ? size : iconSizes[size]}
    color={color}
  />
)

export const CheckmarkCircleIcon = ({
  size = 'md',
  color = colors.grade.easy,
}: BaseIconProps) => (
  <Ionicons
    name="checkmark-circle"
    size={typeof size === 'number' ? size : iconSizes[size]}
    color={color}
  />
)

// Settings Icons
export const SettingsIcon = ({
  size = 'md',
  color = colors.text.primary,
}: BaseIconProps) => (
  <Ionicons
    name="settings"
    size={typeof size === 'number' ? size : iconSizes[size]}
    color={color}
  />
)

export const SettingsOutlineIcon = ({
  size = 'md',
  color = colors.text.secondary,
}: BaseIconProps) => (
  <Ionicons
    name="settings-outline"
    size={typeof size === 'number' ? size : iconSizes[size]}
    color={color}
  />
)

// Notification Icons
export const NotificationsIcon = ({
  size = 'md',
  color = colors.text.primary,
}: BaseIconProps) => (
  <Ionicons
    name="notifications"
    size={typeof size === 'number' ? size : iconSizes[size]}
    color={color}
  />
)

export const NotificationsOutlineIcon = ({
  size = 'md',
  color = colors.text.secondary,
}: BaseIconProps) => (
  <Ionicons
    name="notifications-outline"
    size={typeof size === 'number' ? size : iconSizes[size]}
    color={color}
  />
)

// Download/Cloud Icons
export const CloudDownloadOutlineIcon = ({
  size = 'md',
  color = colors.text.secondary,
}: BaseIconProps) => (
  <Ionicons
    name="cloud-download-outline"
    size={typeof size === 'number' ? size : iconSizes[size]}
    color={color}
  />
)

// Language Icons
export const LanguageIcon = ({
  size = 'md',
  color = colors.text.secondary,
}: BaseIconProps) => (
  <Ionicons
    name="language"
    size={typeof size === 'number' ? size : iconSizes[size]}
    color={color}
  />
)

// Color/Theme Icons
export const ColorPaletteOutlineIcon = ({
  size = 'md',
  color = colors.text.secondary,
}: BaseIconProps) => (
  <Ionicons
    name="color-palette-outline"
    size={typeof size === 'number' ? size : iconSizes[size]}
    color={color}
  />
)

// Call/Phone Icons
export const CallOutlineIcon = ({
  size = 'md',
  color = colors.text.secondary,
}: BaseIconProps) => (
  <Ionicons
    name="call-outline"
    size={typeof size === 'number' ? size : iconSizes[size]}
    color={color}
  />
)

// Information Icons
export const InformationCircleOutlineIcon = ({
  size = 'md',
  color = colors.text.secondary,
}: BaseIconProps) => (
  <Ionicons
    name="information-circle-outline"
    size={typeof size === 'number' ? size : iconSizes[size]}
    color={color}
  />
)

// Document Icons
export const DocumentTextOutlineIcon = ({
  size = 'xl',
  color = colors.text.muted,
}: BaseIconProps) => (
  <Ionicons
    name="document-text-outline"
    size={typeof size === 'number' ? size : iconSizes[size]}
    color={color}
  />
)

// Trail/Route Icons
export const TrailSignOutlineIcon = ({
  size = 'xl',
  color = colors.text.muted,
}: BaseIconProps) => (
  <Ionicons
    name="trail-sign-outline"
    size={typeof size === 'number' ? size : iconSizes[size]}
    color={color}
  />
)

// Cloud/Sync Icons
export const CloudOfflineIcon = ({
  size = 'sm',
  color = colors.text.primary,
}: BaseIconProps) => (
  <Ionicons
    name="cloud-offline"
    size={typeof size === 'number' ? size : iconSizes[size]}
    color={color}
  />
)

export const SyncIcon = ({
  size = 'sm',
  color = colors.text.primary,
}: BaseIconProps) => (
  <Ionicons
    name="sync"
    size={typeof size === 'number' ? size : iconSizes[size]}
    color={color}
  />
)

// Speedometer/Ruler Icons (for Units section)
export const SpeedometerOutlineIcon = ({
  size = 'md',
  color = colors.text.secondary,
}: BaseIconProps) => (
  <Ionicons
    name="speedometer-outline"
    size={typeof size === 'number' ? size : iconSizes[size]}
    color={color}
  />
)

// Fitness/Climbing Icons (for Climbing section)
export const BarbellOutlineIcon = ({
  size = 'md',
  color = colors.text.secondary,
}: BaseIconProps) => (
  <Ionicons
    name="barbell-outline"
    size={typeof size === 'number' ? size : iconSizes[size]}
    color={color}
  />
)

// Radar/Search Icons (for Search section)
export const RadarOutlineIcon = ({
  size = 'md',
  color = colors.text.secondary,
}: BaseIconProps) => (
  <Ionicons
    name="radio-outline"
    size={typeof size === 'number' ? size : iconSizes[size]}
    color={color}
  />
)

// Phone Portrait Icons (for Display section)
export const PhonePortraitOutlineIcon = ({
  size = 'md',
  color = colors.text.secondary,
}: BaseIconProps) => (
  <Ionicons
    name="phone-portrait-outline"
    size={typeof size === 'number' ? size : iconSizes[size]}
    color={color}
  />
)

// Refresh/Reset Icon
export const RefreshOutlineIcon = ({
  size = 'md',
  color = colors.text.secondary,
}: BaseIconProps) => (
  <Ionicons
    name="refresh-outline"
    size={typeof size === 'number' ? size : iconSizes[size]}
    color={color}
  />
)

// Trash/Delete Icon
export const TrashOutlineIcon = ({
  size = 'md',
  color = colors.status.error,
}: BaseIconProps) => (
  <Ionicons
    name="trash-outline"
    size={typeof size === 'number' ? size : iconSizes[size]}
    color={color}
  />
)

// Calendar/Season Icons
export const CalendarIcon = ({
  size = 'md',
  color = colors.text.secondary,
}: BaseIconProps) => (
  <Ionicons
    name="calendar"
    size={typeof size === 'number' ? size : iconSizes[size]}
    color={color}
  />
)

export const CalendarOutlineIcon = ({
  size = 'md',
  color = colors.text.secondary,
}: BaseIconProps) => (
  <Ionicons
    name="calendar-outline"
    size={typeof size === 'number' ? size : iconSizes[size]}
    color={color}
  />
)

export const LeafOutlineIcon = ({
  size = 'md',
  color = colors.status.success,
}: BaseIconProps) => (
  <Ionicons
    name="leaf-outline"
    size={typeof size === 'number' ? size : iconSizes[size]}
    color={color}
  />
)

export const BanOutlineIcon = ({
  size = 'md',
  color = colors.text.muted,
}: BaseIconProps) => (
  <Ionicons
    name="ban-outline"
    size={typeof size === 'number' ? size : iconSizes[size]}
    color={color}
  />
)
