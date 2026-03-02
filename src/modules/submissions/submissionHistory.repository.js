const pool = require("../../config/db");

class SubmissionHistoryRepository {
    async createHistory(data) {
        const { submission_id, old_status, new_status, changed_by } = data;
        const [result] = await pool.query(
            "INSERT INTO submission_status_history (submission_id, old_status, new_status, changed_by) VALUES (?, ?, ?, ?)",
            [submission_id, old_status, new_status, changed_by]
        );
        return { id: result.insertId, ...data };
    }

    async findBySubmissionId(submissionId) {
        const [rows] = await pool.query(
            `SELECT h.*, u.username 
             FROM submission_status_history h
             JOIN users u ON h.changed_by = u.id
             WHERE h.submission_id = ? 
             ORDER BY h.changed_at DESC`,
            [submissionId]
        );
        return rows;
    }
}

module.exports = new SubmissionHistoryRepository();
