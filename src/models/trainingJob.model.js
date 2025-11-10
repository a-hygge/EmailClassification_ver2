import { DataTypes } from "sequelize";

export default (sequelize) => {
  const TrainingJob = sequelize.define("TrainingJob", {
    id: { 
      type: DataTypes.INTEGER, 
      primaryKey: true, 
      autoIncrement: true 
    },
    modelType: { 
      type: DataTypes.STRING(255), 
      allowNull: true
    },
    modelPath: { 
      type: DataTypes.STRING(255), 
      allowNull: true 
    },
    status: { 
      type: DataTypes.STRING(255), 
      allowNull: true
    },
    hyperparameters: { 
      type: DataTypes.STRING(5000), 
      allowNull: true
    },
    result: { 
      type: DataTypes.STRING(5000), 
      allowNull: true
    },
    tblUserId: { 
      type: DataTypes.INTEGER, 
      allowNull: false 
    },
  }, { 
    timestamps: false,
    tableName: 'tblTrainingJob'
  });

  return TrainingJob;
};

