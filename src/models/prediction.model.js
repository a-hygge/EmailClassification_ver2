import { DataTypes } from "sequelize";

export default (sequelize) => {
  const Prediction = sequelize.define(
    "Prediction",
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      tblEmailSampleId: { 
        type: DataTypes.INTEGER, 
        allowNull: false,
        references: {
          model: 'tblEmailSample',
          key: 'id'
        }
      },
      tblModelId: { 
        type: DataTypes.INTEGER, 
        allowNull: false,
        references: {
          model: 'tblModel',
          key: 'id'
        }
      },
      avgConfidence: { type: DataTypes.DECIMAL(4, 3), allowNull: true },
      created_at: { type: DataTypes.DATE, allowNull: true, defaultValue: DataTypes.NOW }
    },
    {
      timestamps: false,
      tableName: 'tblPrediction'
    }
  );

  return Prediction;
};
