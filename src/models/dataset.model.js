import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const Dataset = sequelize.define("Dataset", {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING(255), allowNull: true },
    path: { type: DataTypes.STRING(255), allowNull: true },
    created_at: { type: DataTypes.DATE, allowNull: true, field: 'created_at' },
    description: { type: DataTypes.STRING(255), allowNull: true },
    quantity: { type: DataTypes.INTEGER, allowNull: true },
  }, { 
    timestamps: false,
    tableName: 'tblDataset'
  });

  return Dataset;
};
