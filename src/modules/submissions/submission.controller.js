const submissionService = require("./submission.service");

class SubmissionController {
    createEntity = async (req, res, next) => {
        try {
            const submission = await submissionService.createSubmission(req.body);
            res.status(201).json({
                success: true,
                message: "Submission created successfully",
                data: submission,
            });
        } catch (error) {
            next(error);
        }
    };

    getAllEntities = async (req, res, next) => {
        try {
            const submissions = await submissionService.getAllSubmissions();
            res.status(200).json({
                success: true,
                data: submissions,
            });
        } catch (error) {
            next(error);
        }
    };

    getEntityById = async (req, res, next) => {
        try {
            const submission = await submissionService.getSubmissionById(req.params.id);
            res.status(200).json({
                success: true,
                data: submission,
            });
        } catch (error) {
            next(error);
        }
    };

    updateEntity = async (req, res, next) => {
        try {
            const submission = await submissionService.updateSubmission(req.params.id, req.body);
            res.status(200).json({
                success: true,
                message: "Submission updated successfully",
                data: submission,
            });
        } catch (error) {
            next(error);
        }
    };

    deleteEntity = async (req, res, next) => {
        try {
            await submissionService.deleteSubmission(req.params.id);
            res.status(200).json({
                success: true,
                message: "Submission deleted successfully",
            });
        } catch (error) {
            next(error);
        }
    };

    updateEntityStatus = async (req, res, next) => {
        try {
            const { status } = req.body;
            const submission = await submissionService.updateSubmissionStatus(req.params.id, status);
            res.status(200).json({
                success: true,
                message: "Submission status updated successfully",
                data: submission,
            });
        } catch (error) {
            next(error);
        }
    };
}

module.exports = new SubmissionController();
