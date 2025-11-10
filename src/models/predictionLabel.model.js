import { DataTypes } from "sequelize";

export default (sequelize) => {
  const PredictionLabel = sequelize.define(
    "PredictionLabel",
    {
      tblPredictionId: { 
        type: DataTypes.INTEGER, 
        primaryKey: true,
        allowNull: false,
        references: {
          model: 'tblPrediction',
          key: 'id'
        }
      },
      tblLabelId: { 
        type: DataTypes.INTEGER, 
        primaryKey: true,
        allowNull: false,
        references: {
          model: 'tblLabel',
          key: 'id'
        }
      },
      confidence: { type: DataTypes.DECIMAL(4, 3), allowNull: false },
      created_at: { type: DataTypes.DATE, allowNull: true, defaultValue: DataTypes.NOW }
    },
    {
      timestamps: false,
      tableName: 'tblPredictionLabel',
      id: false // Disable auto id field
    }
  );

  return PredictionLabel;
};
