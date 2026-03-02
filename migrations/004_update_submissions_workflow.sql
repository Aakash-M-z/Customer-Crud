ALTER TABLE submissions 
MODIFY COLUMN status ENUM('New', 'In Review', 'Approved', 'Rejected') DEFAULT 'New',
ADD COLUMN lock_flag BOOLEAN DEFAULT FALSE;

UPDATE submissions SET status = 'New' WHERE status = 'pending';
UPDATE submissions SET status = 'In Review' WHERE status = 'in_progress';
UPDATE submissions SET status = 'Approved', lock_flag = TRUE WHERE status = 'approved';
UPDATE submissions SET status = 'Rejected' WHERE status = 'rejected';
