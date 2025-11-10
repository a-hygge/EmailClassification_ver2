import db from '../models/index.js';
import { Op } from 'sequelize';

const { EmailSample, Label, User } = db;

class EmailController {
  async index(req, res) {
    const stats = req.session.stats || {};
    try {
      const userId = req.session.user.id;
      const page = parseInt(req.query.page) || 1;
      const limit = 20;
      const offset = (page - 1) * limit;

      const userEmail = req.session.user.email; 

      const { count, rows: emails } = await EmailSample.findAndCountAll({
        where: {
          [Op.or]: [
            { sender: userEmail },
            { receiver: userEmail }
          ]
        },
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

      const allLabels = await Label.findAll();

      // Count emails per label (multi-label aware)
      const labelsWithCount = await Promise.all(
        allLabels.map(async (label) => {
          const emailCount = await db.sequelize.query(
            `SELECT COUNT(DISTINCT es.id) as count 
             FROM tblEmailSample es 
             INNER JOIN tblEmailLabel el ON es.id = el.tblEmailSampleId 
             WHERE el.tblLabelId = :labelId 
             AND (es.sender = :userEmail OR es.receiver = :userEmail)`,
            {
              replacements: { labelId: label.id, userEmail },
              type: db.sequelize.QueryTypes.SELECT
            }
          );

          return {
            id: label.id,
            name: label.name,
            count: emailCount[0].count
          };
        })
      );

      res.render('pages/emails/emails', {
        title: 'Hộp thư - Email Classification System',
        layout: 'layouts/main',
        currentPage: 'emails',
        emails: emails,
        labels: labelsWithCount,
        stats: stats,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(count / limit),
          totalEmails: count
        },
        selectedLabel: null
      });

    } catch (error) {
      console.error('Email index error:', error);
      res.status(500).send('Server Error');
    }
  }

  async getByLabel(req, res) {
    try {
      const userId = req.session.user.id;
      const userEmail = req.session.user.email;
      const labelId = parseInt(req.params.labelId);
      const page = parseInt(req.query.page) || 1;
      const limit = 20;
      const offset = (page - 1) * limit;
      const stats = req.session.stats || {};

      // Find emails that have this label (multi-label aware)
      const { count, rows: emails } = await EmailSample.findAndCountAll({
        where: {
          [Op.or]: [
            { sender: userEmail },
            { receiver: userEmail }
          ]
        },
        include: [
          {
            model: Label,
            as: 'labels',
            where: { id: labelId },
            through: { attributes: [] },
            required: true
          }
        ],
        limit,
        offset,
        order: [['id', 'DESC']],
        distinct: true
      });

      // Also load ALL labels for each email for display
      const emailsWithAllLabels = await Promise.all(
        emails.map(async (email) => {
          const fullEmail = await EmailSample.findByPk(email.id, {
            include: [
              {
                model: Label,
                as: 'labels',
                through: { attributes: [] }
              }
            ]
          });
          return fullEmail;
        })
      );

      const allLabels = await Label.findAll();

      const labelsWithCount = await Promise.all(
        allLabels.map(async (label) => {
          const emailCount = await db.sequelize.query(
            `SELECT COUNT(DISTINCT es.id) as count 
             FROM tblEmailSample es 
             INNER JOIN tblEmailLabel el ON es.id = el.tblEmailSampleId 
             WHERE el.tblLabelId = :labelId 
             AND (es.sender = :userEmail OR es.receiver = :userEmail)`,
            {
              replacements: { labelId: label.id, userEmail },
              type: db.sequelize.QueryTypes.SELECT
            }
          );

          return {
            id: label.id,
            name: label.name,
            count: emailCount[0].count
          };
        })
      );

      const selectedLabel = await Label.findByPk(labelId);

      res.render('pages/emails/emails', {
        title: `${selectedLabel.name} - Email Classification System`,
        layout: 'layouts/main',
        currentPage: 'emails',
        emails: emailsWithAllLabels,
        labels: labelsWithCount,
        stats: stats,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(count / limit),
          totalEmails: count
        },
        selectedLabel
      });

    } catch (error) {
      console.error('Email by label error:', error);
      res.status(500).send('Server Error');
    }
  }

  async getImportantEmails(req, res) {
    try {
      return res.redirect('/emails');
    } catch (error) {
      console.error('Important emails error:', error);
      res.status(500).send('Server Error');
    }
  }

  async show(req, res) {
    try {
      const userEmail = req.session.user.email;
      const emailId = parseInt(req.params.id);
      const stats = req.session.stats || {};
      const labelsWithCount = req.session.labelsWithCount || [];

      const email = await EmailSample.findOne({
        where: {
          id: emailId,
          [Op.or]: [
            { sender: userEmail },
            { receiver: userEmail }
          ]
        },
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
        title: email.title || 'Email Detail',
        layout: 'layouts/main',
        currentPage: 'emails',
        email: email,
        labels: labelsWithCount,
        stats: stats,
        selectedLabel: null
      });

    } catch (error) {
      console.error('Email show error:', error);
      res.status(500).send('Server Error');
    }
  }

  async deleteEmail(req, res) {
    const transaction = await db.sequelize.transaction();
    try {
      const emailId = parseInt(req.params.emailId);
      const userId = req.session.user.id;

      const email = await EmailSample.findByPk(emailId, { transaction });

      if (!email) {
        await transaction.rollback();
        return res.status(404).json({ success: false, message: 'Email not found' });
      }

      await EmailSample.destroy({
        where: { id: emailId },
        transaction: transaction
      });

      await transaction.commit();
      res.json({ success: true, message: 'Email đã được xóa thành công' });
    }
    catch (error) {
      await transaction.rollback();
      console.error('Delete email error:', error);
      res.status(500).json({ success: false, message: 'Server error khi xóa email' });
    }
  }
}

const emailController = new EmailController();

export const {
  index,
  getByLabel,
  show,
  deleteEmail,
  getImportantEmails
} = emailController;

export default emailController;