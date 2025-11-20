import { Database, Statement } from 'bun:sqlite'
import { logger as log } from '../utils/logger'
import { withTimeout } from '../utils/timeout';

export interface NotificationRecord {
	eventId: string;
	notificationTime: number;
	sentAt: string;
}

type HasNotifiedRow = { '1': number } | null;
type CountRow = { count: number };

const DB_FILE = './notifications.db';
let db: Database;

async function loadSQL(filename: string): Promise<string> {
	const file = Bun.file(`src/storage/${filename}`)
	return withTimeout(
		file.text(),
		5000,
		`Failed to load SQL file: ${filename}`
	)
}

async function initDb() {
	try {
		db = new Database(DB_FILE, {
			create: true,
			readwrite: true,
		});
		const schema = await withTimeout(
			loadSQL('schema.sql'),
			5_000,
			'Schema file load timeout'
		);
		db.run(schema);

		log.info('Database initialized')
	} catch (error) {
		log.error('Database init failed: ', error);
		throw error;
	}
}

const queries: {
	has: Statement<HasNotifiedRow, [string, number]> | null;
	insert: Statement<void, [string, number, string]> | null;
	cleanup: Statement<void, [string]> | null;
	getAll: Statement<NotificationRecord, []> | null;
} = {
	has: null,
	insert: null,
	cleanup: null,
	getAll: null,
};

async function prepareStatements() {
	try {
		const [hasSQL, insertSQL, cleanupSQL, getAllSQL] = await Promise.all([
			withTimeout(loadSQL('has-notified.sql'), 5_000, 'has-notified.sql timeout'),
			withTimeout(loadSQL('mark-notified.sql'), 5_000, 'mark-notified.sql timeout'),
			withTimeout(loadSQL('cleanup.sql'), 5_000, 'cleanup.sql timeout'),
			withTimeout(loadSQL('get-all.sql'), 5_000, 'get-all.sql timeout'),
		])

		queries.has = db.query(hasSQL);
		queries.insert = db.query(insertSQL);
		queries.cleanup = db.query(cleanupSQL);
		queries.getAll = db.query(getAllSQL);
	} catch (error) {
		log.error('Failed to prepare SQL statement: ', error);
		throw error;
	}
}

export const notificationStore = {
	async init() {
		try {
			await initDb();
			await prepareStatements();

			const count = db.query('SELECT COUNT(*) as count FROM notifications').get() as { count: number };
			log.info(`Loaded ${count.count} notification records from database`)
		} catch (error) {
			log.error('Failed to init notification store: ', error);
			throw new Error('Database initialization failed - cannot start app');
		}

	},

	hasNotified(eventId: string, notificationTime: number): boolean {
		const result = queries.has!.get(eventId, notificationTime);
		return result !== null;
	},

	markNotified(eventId: string, notificationTime: number): void {
		const sentAt = new Date().toISOString();
		queries.insert!.run(eventId, notificationTime, sentAt);

		log.debug(`marked as notified: ${eventId} (${notificationTime}min)`);
	},

	cleanup(daysToKeep: number): void {
		const cutOff = new Date();
		cutOff.setDate(cutOff.getDate() - daysToKeep);
		const cutoffIso = cutOff.toISOString();

		const result = queries.cleanup!.run(cutoffIso);
		if (result.changes > 0) {
			log.info(`Cleaned up ${result.changes} old notification records`)
		}
	},

	getAll(): NotificationRecord[] {
		return queries.getAll!.all() as NotificationRecord[];
	},

	close() {
		db.close();
		log.info('Database closed')
	},
};
