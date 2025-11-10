import { DataTypes } from "sequelize";

export default (sequelize) => {
  const User = sequelize.define("User", {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    username: { type: DataTypes.STRING(255), allowNull: true },
    password: { type: DataTypes.STRING(255), allowNull: true },
    email: { type: DataTypes.STRING(255), allowNull: true, unique: true },
  }, { 
    timestamps: false,
    tableName: 'tblUser'
  });

  return User;
};
