import { calendar_v3, google } from "googleapis";
import { logger } from "../utils/logger";

export interface CalendarEvent {
	id: string;
	title: string;
	start: Date;
	end: Date;
	location?: string;
	description?: string;
}

interface GoogleCredentials {
	installed: {
		client_secret: string;
		client_id: string;
		redirect_uris: string[];
	};
}

async function loadCredentials(path: string): Promise<GoogleCredentials> {
	try {
		const file = Bun.file(path);
		const content = await file.text();
		return JSON.parse(content) as GoogleCredentials;
	} catch (error) {
		logger.error("failed to load credentials: ", error);
		throw new Error(`Could not load credentials from ${path}`);
	}
}

async function loadToken(path: string): Promise<any | null> {
	try {
		const file = Bun.file(path)
		const content = await file.text();
		return JSON.parse(content);
	} catch {
		logger.warn("token does not exists yet")
		return null;
	}
}

async function saveToken(path: string, token: any): Promise<void> {
	await Bun.write(path, JSON.stringify(token, null, 2));
	logger.info("token saved to:", path)
}

async function authorize(credentials: GoogleCredentials, tokenPath: string) {
	const { client_secret, client_id, redirect_uris } = credentials.installed;
	const oAuth2Client = new google.auth.OAuth2(
		client_id,
		client_secret,
		redirect_uris[0]
	);


	const token = await loadToken(tokenPath);
	if (token) {
		oAuth2Client.setCredentials(token);
		return oAuth2Client;
	}

	const authUrl = oAuth2Client.generateAuthUrl({
		access_type: 'offline',
		scope: ['https://www.googleapis.com/auth/calendar.readonly'],
	});

	logger.info('Authorize this app by visiting this URL: ', authUrl);
	logger.info('After authorization, paste the code here and press Enter');

	const code = await new Promise<string>((resolve) => {
		process.stdin.once('data', (data) => {
			resolve(data.toString().trim());
		});
	});

	const { tokens } = await oAuth2Client.getToken(code);
	oAuth2Client.setCredentials(tokens);
	await saveToken(tokenPath, tokens);

	return oAuth2Client;
}

function toCalendarEvent(event: calendar_v3.Schema$Event): CalendarEvent | null {
	if (!event.id || !event.summary) {
		logger.warn("skipping event without id or summary");
		return null
	}

	const start = event.start?.dateTime || event.start?.date;
	const end = event.end?.dateTime || event.end?.date;

	if (!start || !end) {
		logger.warn(`Skipping event ${event.id} without start/end time`)
		return null
	}

	return {
		id: event.id,
		title: event.summary,
		start: new Date(start),
		end: new Date(end),
		location: event.location?.toString(),
		description: event.description?.toString(),
	}
}
