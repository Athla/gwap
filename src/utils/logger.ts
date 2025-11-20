
export enum LogLevel {
	DEBUG = 0,
	INFO = 1,
	WARN = 2,
	ERROR = 3,
}

let currLevel: LogLevel = process.env.LOG_LEVEL === 'DEBUG' ? LogLevel.DEBUG : LogLevel.INFO;

function log(level: LogLevel, message: string, ...args: any[]) {
	if (level < currLevel) return;

	const timestamp = new Date().toISOString();
	const levelName = LogLevel[level];

	const prefix = `[${timestamp}] [${levelName}]`;

	switch (level) {
		case LogLevel.DEBUG:
			console.debug(prefix, message, ...args);
			break
		case LogLevel.INFO:
			console.info(prefix, message, ...args);
			break
		case LogLevel.WARN:
			console.warn(prefix, message, ...args);
			break
		case LogLevel.ERROR:
			console.error(prefix, message, ...args);
			break
	}
}

export const logger = {
	debug: (message: string, ...args: any[]) => log(LogLevel.DEBUG, message, ...args),
	info: (message: string, ...args: any[]) => log(LogLevel.INFO, message, ...args),
	warn: (message: string, ...args: any[]) => log(LogLevel.WARN, message, ...args),
	error: (message: string, ...args: any[]) => log(LogLevel.ERROR, message, ...args),
	setLevel: (level: LogLevel) => { currLevel = level; },
}
