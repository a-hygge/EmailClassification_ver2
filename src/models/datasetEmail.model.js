import { DataTypes } from "sequelize";

export default (sequelize) => {
  const DatasetEmail = sequelize.define("DatasetEmail", {
    tblDatasetId: { 
      type: DataTypes.INTEGER, 
      allowNull: false,
      primaryKey: true
    },
    tblEmailSampleId: { 
      type: DataTypes.INTEGER, 
      allowNull: false,
      primaryKey: true
    },
  }, { 
    timestamps: false,
    tableName: 'tblDatasetEmail',
    id: false // Disable auto id field
  });

  return DatasetEmail;
};
