const submissionRepository = require("./submission.repository");
const { AppError } = require("../../middlewares/errorMiddleware");

class SubmissionService {
    async createSubmission(data) {
        // Business logic: Limit Max Submissions per email for anti-spam maybe?
        const allowedStatuses = ['pending', 'in_progress', 'approved', 'rejected'];
        if (data.status && !allowedStatuses.includes(data.status)) {
            throw new AppError("Invalid status value", 400);
        }

        const newSubmission = await submissionRepository.create(data);
        return newSubmission;
    }

    async getAllSubmissions() {
        return await submissionRepository.findAll();
    }

    async getSubmissionById(id) {
        const submission = await submissionRepository.findById(id);
        if (!submission) {
            throw new AppError("Submission not found", 404);
        }
        return submission;
    }

    async updateSubmission(id, data) {
        // Business logic: check if submission exists
        const existingSubmission = await submissionRepository.findById(id);
        if (!existingSubmission) {
            throw new AppError("Submission not found", 404);
        }

        const allowedStatuses = ['pending', 'in_progress', 'approved', 'rejected'];
        if (data.status && !allowedStatuses.includes(data.status)) {
            throw new AppError("Invalid status value", 400);
        }

        const updatedSubmission = await submissionRepository.update(id, data);
        return updatedSubmission;
    }

    async deleteSubmission(id) {
        const existingSubmission = await submissionRepository.findById(id);
        if (!existingSubmission) {
            throw new AppError("Submission not found", 404);
        }

        const isDeleted = await submissionRepository.delete(id);
        if (!isDeleted) {
            throw new AppError("Failed to delete submission", 500);
        }
    }

    async updateSubmissionStatus(id, newStatus) {
        const existingSubmission = await submissionRepository.findById(id);
        if (!existingSubmission) {
            throw new AppError("Submission not found", 404);
        }

        const allowedStatuses = ['pending', 'in_progress', 'approved', 'rejected'];
        if (!allowedStatuses.includes(newStatus)) {
            throw new AppError("Invalid status value", 400);
        }

        const updatedSubmission = await submissionRepository.update(id, { status: newStatus });
        return updatedSubmission;
    }
}

module.exports = new SubmissionService();
