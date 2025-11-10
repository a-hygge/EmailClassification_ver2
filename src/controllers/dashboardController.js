import db from '../models/index.js';
import { Op } from 'sequelize';
import emailDao from '../dao/emailDao.js';
import labelDao from '../dao/labelDao.js';
import modelDao from '../dao/modelDao.js';

const { Label, EmailSample, sequelize } = db;

class DashboardController {
  async index(req, res) {
    try {
      const userEmail = req.session.user.email;

      const totalSamples = await EmailSample.count({
        where: {
          [Op.or]: [
            { sender: userEmail },
            { receiver: userEmail }
          ]
        }
      });

      const labels = await labelDao.findAll();

      const labelsWithCount = await Promise.all(
        labels.map(async (label) => {
          const emailCount = await db.sequelize.query(
            `SELECT COUNT(DISTINCT es.id) as count
             FROM tblEmailSample es
             INNER JOIN tblEmailLabel el ON es.id = el.tblEmailSampleId
             WHERE el.tblLabelId = :labelId
             AND (es.sender = :userEmail OR es.receiver = :userEmail)`,
            {
              replacements: { labelId: label.id, userEmail: userEmail },
              type: db.sequelize.QueryTypes.SELECT
            }
          );

          return {
            id: label.id,
            name: label.name,
            description: label.description,
            emailCount: emailCount[0].count
          };
        })
      );

      const models = await modelDao.findAll();
      const activeModel = await modelDao.getActiveModel();

      const recentSamples = await emailDao.findAll({
        where: {
          [Op.or]: [
            { sender: userEmail },
            { receiver: userEmail }
          ]
        },
        include: [
          { model: Label, as: 'labels', through: { attributes: [] } }
        ],
        order: [['id', 'DESC']],
        limit: 10
      });

      const modelStats = {
        total: models.length,
        active: activeModel ? 1 : 0,
        bestAccuracy: models.length > 0 
          ? Math.max(...models.map(m => m.accuracy || 0)) 
          : 0
      };

      const stats = {
        totalSamples: totalSamples,
        totalLabels: labels.length,
        totalModels: models.length,
        activeModel: activeModel ? activeModel.version : 'None'
      };

      req.session.stats = stats;
      req.session.labelsWithCount = labelsWithCount;
      
      res.render('pages/dashboard/dashboard', {
        title: 'Dashboard - Email Classification System',
        layout: 'layouts/main',
        currentPage: 'dashboard',
        stats: stats,
        labels: labelsWithCount,
        recentEmails: recentSamples, 
        models: models,
        activeModel: activeModel,
        modelStats: modelStats,
        chartData: {
          days: labelsWithCount.map(l => l.name),
          counts: labelsWithCount.map(l => l.emailCount)
        },
        selectedLabel: null
      });

    } catch (error) {
      console.error('Dashboard error:', error);
      res.status(500).render('pages/error', {
        title: 'Error',
        message: 'Có lỗi xảy ra khi tải dashboard',
        layout: 'layouts/main'
      });
    }
  }
}

const dashboardController = new DashboardController();

export const { index } = dashboardController;

export default dashboardController;