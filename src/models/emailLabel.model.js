import { DataTypes } from "sequelize";

export default (sequelize) => {
  const EmailLabel = sequelize.define(
    "EmailLabel",
    {
      tblEmailSampleId: { 
        type: DataTypes.INTEGER, 
        primaryKey: true,
        allowNull: false,
        references: {
          model: 'tblEmailSample',
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
      created_at: { type: DataTypes.DATE, allowNull: true, defaultValue: DataTypes.NOW }
    },
    {
      timestamps: false,
      tableName: 'tblEmailLabel',
      id: false // Disable auto id field
    }
  );

  return EmailLabel;
};
