import { DataTypes } from "sequelize";

export default (sequelize) => {
  const EmailUser = sequelize.define("EmailUser", {
    tblUserId: { 
      type: DataTypes.INTEGER, 
      allowNull: false,
      primaryKey: true
    },
    tblEmailId: { 
      type: DataTypes.INTEGER, 
      allowNull: false,
      primaryKey: true
    },
    type: { 
      type: DataTypes.STRING(255), 
      allowNull: true 
    },
  }, { 
    timestamps: false,
    tableName: 'tblEmailUser'
  });

  return EmailUser;
};
