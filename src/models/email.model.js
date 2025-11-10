import { DataTypes } from "sequelize";

export default (sequelize) => {
  const EmailSample = sequelize.define(
    "EmailSample",
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      title: { type: DataTypes.STRING(255), allowNull: false },
      content: { type: DataTypes.STRING(5000), allowNull: false },
      sender: { type: DataTypes.STRING(255), allowNull: true },
      receiver: { type: DataTypes.STRING(255), allowNull: true },
      created_at: { type: DataTypes.DATE, allowNull: true, defaultValue: DataTypes.NOW }
    },
    {
      timestamps: false,
      tableName: 'tblEmailSample'
    }
  );

  return EmailSample;
};