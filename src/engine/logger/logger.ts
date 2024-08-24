import { createLogger, format, transports } from 'winston'
const { combine, timestamp, label, printf } = format

const messageformat = printf(({ level, message, label, timestamp }) => {
  return `${timestamp} ${label} [${level}]: ${message}`
})

export const logger = createLogger({
  level: 'debug',
  format: combine(
    format.colorize(),
    label({ label: 'dev' }),
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    messageformat
  ),
  transports: [new transports.Console()]
})
