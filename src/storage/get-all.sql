SELECT 
	event_id as eventId,
	notification_time as notificationTime,
	sent_at as sentAt
FROM notifications
ORDER BY sent_at DESC
