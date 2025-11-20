DELETE FROM notifications
WHERE sent_at < ?1
