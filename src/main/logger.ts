import log from "electron-log/main";

log.initialize();

// Disable file transport — log only to terminal console
log.transports.file.level = false;

// Format: [HH:MM:SS.mmm] [LEVEL] message
log.transports.console.format = "[{h}:{i}:{s}.{ms}] [{level}] {scope} {text}";
log.transports.console.useStyles = false;

// Catch unhandled errors and rejections in the main process
log.errorHandler.startCatching();

export default log;
