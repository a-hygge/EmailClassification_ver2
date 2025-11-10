import db from '../models/index.js';
import { Op } from 'sequelize';

const { EmailSample, Label, User } = db;

class EmailSystemController {
  async getAllEmails(req, res) {
    try {
      const stats = req.session.stats || {};
      const labelsWithCount = req.session.labelsWithCount || [];
      const page = parseInt(req.query.page) || 1;
      const limit = 20;
      const offset = (page - 1) * limit;

      const { count, rows: emails } = await EmailSample.findAndCountAll({
        include: [
          {
            model: Label,
            as: 'labels',
            through: { attributes: [] },
            required: false
          }
        ],
        limit,
        offset,
        order: [['id', 'DESC']],
        distinct: true
      });

      res.render('pages/emails/emailsSystem', {
        title: 'Email System - Email Classification System',
        layout: 'layouts/main',
        currentPage: 'emailsSystem',
        emails: emails,
        stats: stats,
        labels: labelsWithCount,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(count / limit),
          totalEmails: count
        },
        selectedLabel: null
      })
    } catch (error) {
      console.error('Error fetching emails:', error)
      res.status(500).send('Internal Server Error')
    }
  }

  async getDetailEmailSystemById(req, res) {
    try {
      const emailId = parseInt(req.params.id);
      const stats = req.session.stats || {};
      const labelsWithCount = req.session.labelsWithCount || [];
      
      const email = await EmailSample.findOne({
        where: { id: emailId },
        include: [
          {
            model: Label,
            as: 'labels',
            through: { attributes: [] },
            required: false
          }
        ]
      });

      if (!email) {
        return res.status(404).send('Email not found');
      }

      res.render('pages/emails/emailDetail', {
        title: email.title,
        layout: 'layouts/main',
        email: email,
        currentPage: 'emailsSystem',
        stats: stats,
        labels: labelsWithCount,
        selectedLabel: null
      });
    } catch (error) {
      console.error('Error fetching email detail:', error);
      res.status(500).send('Internal Server Error');
    }
  }

  async deleteEmailSystemById(req, res) {
    const transaction = await db.sequelize.transaction();
    try {
      const emailId = parseInt(req.params.emailId);

      await EmailSample.destroy({
        where: { id: emailId },
        transaction
      });

      await transaction.commit();
      res.json({ success: true, message: 'Email đã được xóa thành công' });

    }
    catch (error) {
      await transaction.rollback();
      console.error('Error deleting email system:', error);
      return res.status(500).json({ success: false, message: 'Lỗi khi xóa email' });
    }
  }
}

const emailSystemController = new EmailSystemController();
export const { getAllEmails, getDetailEmailSystemById, deleteEmailSystemById } = emailSystemController;

export default emailSystemController;