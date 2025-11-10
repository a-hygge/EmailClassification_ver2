import emailDao from '../dao/emailDao.js';
import classificationService from '../services/classificationService.js';

class ApiController {
  /**
   * POST /api/emails/receive
   * 
   */
  async receiveEmail(req, res) {
    try {
      const { from, to, subject, body } = req.body;

      if (!from || !to || !subject || !body) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: from, to, subject, body'
        });
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(from)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid email format for "from" field'
        });
      }
      if (!emailRegex.test(to)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid email format for "to" field'
        });
      }
      if (subject.trim().length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Subject cannot be empty'
        });
      }

      if (body.trim().length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Body cannot be empty'
        });
      }
      // Create email without labels first
      const email = await emailDao.create({
        title: subject,
        content: body,
        sender: from,
        receiver: to,
        labelIds: [] // Empty initially
      });

      // Classify email to get multiple labels
      const classificationResult = await classificationService.classifyEmail({
        title: subject,
        content: body
      });

      // Update email with classified labels
      if (classificationResult.success && classificationResult.labels && classificationResult.labels.length > 0) {
        const labelIds = classificationResult.labels.map(l => l.labelId);
        await emailDao.updateLabels(email.id, labelIds);
      }

      return res.status(201).json({
        success: true,
        message: 'Email received and classified successfully',
        data: {
          emailId: email.id,
          from: from,
          to: to,
          subject: subject,
          classification: {
            labels: classificationResult.labels || [],
            avgConfidence: classificationResult.avgConfidence || 0
          }
        }
      });

    } catch (error) {
      console.error('Receive email error:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error.message
      });
    }
  }
}

const apiController = new ApiController();

export const { receiveEmail } = apiController;

export default apiController;
