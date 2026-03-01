const pool = require("../../config/db");

class SubmissionRepository {
    async create(submission) {
        const { title, description, submitter_email, status } = submission;
        const [result] = await pool.query(
            "INSERT INTO submissions (title, description, submitter_email, status) VALUES (?, ?, ?, ?)",
            [title, description, submitter_email, status || "pending"]
        );
        return { id: result.insertId, ...submission, status: status || "pending" };
    }

    async findAll() {
        const [rows] = await pool.query("SELECT * FROM submissions ORDER BY created_at DESC");
        return rows;
    }

    async findById(id) {
        const [rows] = await pool.query("SELECT * FROM submissions WHERE id = ?", [id]);
        return rows[0];
    }

    async update(id, submissionData) {
        const excludeFields = ["id", "created_at"];
        let updateFields = [];
        let values = [];

        Object.keys(submissionData).forEach((key) => {
            if (!excludeFields.includes(key) && submissionData[key] !== undefined) {
                updateFields.push(`${key} = ?`);
                values.push(submissionData[key]);
            }
        });

        if (updateFields.length === 0) return null;

        const setClause = updateFields.join(", ");
        values.push(id);

        const [result] = await pool.query(
            `UPDATE submissions SET ${setClause} WHERE id = ?`,
            values
        );

        if (result.affectedRows === 0) return null;

        return this.findById(id);
    }

    async delete(id) {
        const [result] = await pool.query("DELETE FROM submissions WHERE id = ?", [id]);
        return result.affectedRows > 0;
    }

    async countByEmail(email) {
        const [rows] = await pool.query("SELECT COUNT(*) as count FROM submissions WHERE submitter_email = ?", [email]);
        return rows[0].count;
    }
}

module.exports = new SubmissionRepository();
