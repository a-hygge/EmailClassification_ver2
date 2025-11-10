import { DataTypes } from "sequelize";

export default (sequelize) => {
  const Label = sequelize.define("Label", {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING(255), allowNull: true },
    description: { type: DataTypes.STRING(255), allowNull: true },
  }, { 
    timestamps: false,
    tableName: 'tblLabel'
  });

  return Label;
};
