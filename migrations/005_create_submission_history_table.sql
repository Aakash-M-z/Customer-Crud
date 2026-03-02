CREATE TABLE IF NOT EXISTS submission_status_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    submission_id INT NOT NULL,
    old_status ENUM('New', 'In Review', 'Approved', 'Rejected') NOT NULL,
    new_status ENUM('New', 'In Review', 'Approved', 'Rejected') NOT NULL,
    changed_by INT NOT NULL,
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (submission_id) REFERENCES submissions(id) ON DELETE CASCADE,
    FOREIGN KEY (changed_by) REFERENCES users(id) ON DELETE RESTRICT,
    INDEX idx_submission_id (submission_id),
    INDEX idx_changed_by (changed_by)
);
