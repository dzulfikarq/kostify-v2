DROP TABLE IF EXISTS events;
DROP TABLE IF EXISTS messages;
DROP TABLE IF EXISTS conversations;
DROP TABLE IF EXISTS kost_assignments;
DROP TABLE IF EXISTS email_verification_tokens;
ALTER TABLE bookings DROP COLUMN IF EXISTS survey_date;
ALTER TABLE users DROP COLUMN IF EXISTS email_verified;
ALTER TABLE users DROP COLUMN IF EXISTS gender;
