import { sequelize } from '../config/database.js';

import UserModel from "./user.model.js";
import EmailSampleModel from "./email.model.js";
import EmailUserModel from "./emailUser.model.js";
import DatasetModel from "./dataset.model.js";
import DatasetEmailModel from "./datasetEmail.model.js";
import ModelModel from "./model.model.js";
import LabelModel from "./label.model.js";
import TrainingJobModel from "./trainingJob.model.js";
import EmailLabelModel from "./emailLabel.model.js";
import PredictionModel from "./prediction.model.js";
import PredictionLabelModel from "./predictionLabel.model.js";

const User = UserModel(sequelize);
const EmailSample = EmailSampleModel(sequelize);
const EmailUser = EmailUserModel(sequelize);
const Dataset = DatasetModel(sequelize);
const DatasetEmail = DatasetEmailModel(sequelize);
const Model = ModelModel(sequelize);
const Label = LabelModel(sequelize);
const TrainingJob = TrainingJobModel(sequelize);
const EmailLabel = EmailLabelModel(sequelize);
const Prediction = PredictionModel(sequelize);
const PredictionLabel = PredictionLabelModel(sequelize);

// =============================================
// RELATIONSHIPS - Multi-label Support
// =============================================

// EmailSample <-> Label (Many-to-Many via EmailLabel)
EmailSample.belongsToMany(Label, { 
  through: EmailLabel, 
  foreignKey: "tblEmailSampleId",
  otherKey: "tblLabelId",
  as: "labels",
  constraints: false
});
Label.belongsToMany(EmailSample, { 
  through: EmailLabel, 
  foreignKey: "tblLabelId",
  otherKey: "tblEmailSampleId",
  as: "emailSamples",
  constraints: false
});

// Dataset <-> Model
Dataset.hasMany(Model, { foreignKey: "tblDatasetId", as: "models" });
Model.belongsTo(Dataset, { foreignKey: "tblDatasetId", as: "dataset" });

// User <-> TrainingJob
User.hasMany(TrainingJob, { foreignKey: "tblUserId", as: "trainingJobs" });
TrainingJob.belongsTo(User, { foreignKey: "tblUserId", as: "user" });

// User <-> EmailSample (Many-to-Many via EmailUser) - REMOVED IN NEW SCHEMA
// This table doesn't exist in the new schema

// Dataset <-> EmailSample (Many-to-Many via DatasetEmail)
Dataset.belongsToMany(EmailSample, { 
  through: DatasetEmail, 
  foreignKey: "tblDatasetId",
  otherKey: "tblEmailSampleId",
  as: "emails",
  constraints: false
});
EmailSample.belongsToMany(Dataset, { 
  through: DatasetEmail, 
  foreignKey: "tblEmailSampleId",
  otherKey: "tblDatasetId",
  as: "datasets",
  constraints: false
});

// Prediction <-> EmailSample
Prediction.belongsTo(EmailSample, { foreignKey: "tblEmailSampleId", as: "email" });
EmailSample.hasMany(Prediction, { foreignKey: "tblEmailSampleId", as: "predictions" });

// Prediction <-> Model
Prediction.belongsTo(Model, { foreignKey: "tblModelId", as: "model" });
Model.hasMany(Prediction, { foreignKey: "tblModelId", as: "predictions" });

// Prediction <-> Label (Many-to-Many via PredictionLabel)
Prediction.belongsToMany(Label, { 
  through: PredictionLabel, 
  foreignKey: "tblPredictionId",
  otherKey: "tblLabelId",
  as: "labels",
  constraints: false
});
Label.belongsToMany(Prediction, { 
  through: PredictionLabel, 
  foreignKey: "tblLabelId",
  otherKey: "tblPredictionId",
  as: "predictions",
  constraints: false
});

export default {
  sequelize,
  User,
  EmailSample,
  EmailUser,
  Dataset,
  DatasetEmail,
  Model,
  Label,
  TrainingJob,
  EmailLabel,
  Prediction,
  PredictionLabel,
};
