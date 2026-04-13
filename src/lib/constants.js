export const VOICE_COMMANDS = /** @type {const} */ ([
  'start',
  'walk mode',
  'describe',
  'capture',
  'describe in detail',
  'start walk mode',
  'pause walk mode',
  'resume walk mode',
  'stop walk mode',
  'go back',
  'stop',
  'repeat',
  'tutorial',
  'settings',
  'help',
])

export const DETAIL_LEVELS = /** @type {const} */ (['brief', 'standard', 'detailed'])

export const FONT_SIZES = /** @type {const} */ (['normal', 'large', 'xl'])

export const FONT_SIZE_CLASSES = {
  normal: 'text-base',
  large: 'text-lg',
  xl: 'text-xl',
}

export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024 // 5 MB

export const QUERY_STALE_TIME = 5 * 60 * 1000 // 5 minutes

export const QUERY_RETRY_COUNT = 1

export const TTS_DEFAULT_SPEED = 1

export const WALK_TARGET_FPS_DEFAULT = 0.6
export const WALK_TARGET_FPS_MIN = 0.3
export const WALK_TARGET_FPS_MAX = 2

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  DESCRIBE: '/describe',
  SESSION_MEMORY: '/session-memory',
  READ_WEB: '/read-web',
  READ_DOC: '/read-doc',
  SETTINGS: '/settings',
}
