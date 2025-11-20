interface CalendarConfig {
	credentialsPath: string;
	tokenPath: string;
	calendarId: string;
}

interface WhatsAppConfig {
	sessionPath: string;
	targetNumber: string;
}

interface NotificationConfig {
	checkInterval: string; // this a cron expression
	notifyBefore: number[];
	messageTemplate: string;
}

export interface AppConfig {
	calendar: CalendarConfig;
	whatsapp: WhatsAppConfig;
	notifications: NotificationConfig;
}

export function loadConfig(): AppConfig {
	const required = [
		'CALENDAR_CREDENTIALS_PATH',
		'CALENDAR_TOKEN_PATH',
		'WHATSAPP_TARGET_NUMBER',
	]

	const missing = required.filter(key => !process.env[key]);
	if (missing.length > 0) {
		throw new Error(`Missing required env variables: ${missing.join(',')}`);
	}

	const notifyefore = (process.env.NOTIFY_BEFORE || '60').split(',').map(s => parseInt(s.trim(), 10));

	return {
		calendar: {
			credentialsPath: process.env.CALENDAR_CREDENTAILS_PATH!,
			tokenPath: process.env.CALENDAR_TOKEN_PATH || './token.json',
			calendarId: process.env.CALENDAR_ID || 'primary',
		},
		whatsapp: {
			sessionPath: process.env.WHATSAPP_SESSION_PATH || './.wwebjs_auth',
			targetNumber: process.env.WHATSAPP_TARGET_NUMBER!,
		},
		notifications: {
			checkInterval: process.env.CHECK_INTERVAL || '*/30 * * * *',
			notifyBefore: notifyefore,
			messageTemplate: process.env.MESSAGE_TEMPLATE ||
				'📅 {{title}}\n⏰ {{time}}\n📍 {{location}}',
		},
	};
}
