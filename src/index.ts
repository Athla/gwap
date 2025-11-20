import { notificationStore } from "./storage/notification";
import { logger } from "./utils/logger";
import { withTimeout } from "./utils/timeout";

async function startup() {
	logger.info('starting calendar notifier')

	try {
		await withTimeout(
			notificationStore.init(),
			10_000,
			'Database timeout in initialization'
		);

		logger.info('All services initialized')
	} catch (error) {
		logger.error('startup failed: ', error);
		process.exit(1);
	}
}

process.on('SIGINT', () => {
	logger.info('Shutting down gracefully...');
	notificationStore.close();
	process.exit(0);
})

process.on('SIGTERM', () => {
	logger.info('Shutting down gracefully...');
	notificationStore.close();
	process.exit(0);
})

startup()
