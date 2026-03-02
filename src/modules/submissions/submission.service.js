const submissionRepository = require("./submission.repository");
const { AppError } = require("../../middlewares/errorMiddleware");

class SubmissionService {
    static STATUS = {
        NEW: "New",
        IN_REVIEW: "In Review",
        APPROVED: "Approved",
        REJECTED: "Rejected",
    };

    async createSubmission(data, user = null) {
        // Customers/Users can only create 'New' submissions
        const submissionData = {
            ...data,
            status: this.constructor.STATUS.NEW,
            lock_flag: 0
        };

        const newSubmission = await submissionRepository.create(submissionData);
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

    async updateSubmission(id, data, user) {
        const existingSubmission = await this.getSubmissionById(id);

        // Rule: Locked submissions cannot be edited
        if (existingSubmission.lock_flag) {
            throw new AppError("Submission is locked and cannot be edited", 403);
        }

        // Rule: Customer cannot edit if status is not 'New'
        if (user.role === "user" && existingSubmission.status !== this.constructor.STATUS.NEW) {
            throw new AppError("You can only edit submissions when they are in 'New' status", 403);
        }

        // If status is being changed, validate the transition
        if (data.status && data.status !== existingSubmission.status) {
            // We reuse the status transition logic
            await this.validateStatusTransition(existingSubmission.status, data.status, user);

            // Set lock_flag if approved
            if (data.status === this.constructor.STATUS.APPROVED) {
                data.lock_flag = 1;
            }
        } else {
            // Ensure status is not accidentally changed or lock_flag is not manipulated
            delete data.status;
            delete data.lock_flag;
        }

        const updatedSubmission = await submissionRepository.update(id, data);
        return updatedSubmission;
    }

    async validateStatusTransition(currentStatus, newStatus, user) {
        // Rule: New -> In Review (Moderator/Admin)
        if (currentStatus === this.constructor.STATUS.NEW && newStatus === this.constructor.STATUS.IN_REVIEW) {
            if (!["manager", "admin"].includes(user.role)) {
                throw new AppError("Only Moderators or Admins can move a submission to 'In Review'", 403);
            }
        }
        // Rule: In Review -> Approved/Rejected (Admin only)
        else if (currentStatus === this.constructor.STATUS.IN_REVIEW && (newStatus === this.constructor.STATUS.APPROVED || newStatus === this.constructor.STATUS.REJECTED)) {
            if (user.role !== "admin") {
                throw new AppError("Only Admins can Approve or Reject submissions", 403);
            }
        }
        // Rule: Any other transitions are invalid
        else {
            throw new AppError(`Invalid status transition from '${currentStatus}' to '${newStatus}'`, 400);
        }
    }

    async deleteSubmission(id, user) {
        const existingSubmission = await this.getSubmissionById(id);

        // Rule: Locked submissions cannot be deleted
        if (existingSubmission.lock_flag) {
            throw new AppError("Submission is locked and cannot be deleted", 403);
        }

        const isDeleted = await submissionRepository.delete(id);
        if (!isDeleted) {
            throw new AppError("Failed to delete submission", 500);
        }
        return isDeleted;
    }

    async updateSubmissionStatus(id, newStatus, user) {
        const existingSubmission = await this.getSubmissionById(id);
        const { status: currentStatus } = existingSubmission;

        if (currentStatus === newStatus) {
            return existingSubmission;
        }

        // Use the common validation helper
        await this.validateStatusTransition(currentStatus, newStatus, user);

        const updateData = { status: newStatus };

        // Rule: Lock if status becomes Approved
        if (newStatus === this.constructor.STATUS.APPROVED) {
            updateData.lock_flag = 1;
        }

        const updatedSubmission = await submissionRepository.update(id, updateData);
        return updatedSubmission;
    }
}

module.exports = new SubmissionService();
