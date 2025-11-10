
import db from "../models/index.js";

const { Label } = db;

class LabelDao {
  async findByName(name) {
    try {
      const label = await Label.findOne({
        where: { name },
      });
      return label;
    } catch (error) {
      console.error("Error finding label by name:", error);
      throw error;
    }
  }

  async findById(id) {
    try {
      const label = await Label.findByPk(id);
      return label;
    } catch (error) {
      console.error("Error finding label by ID:", error);
      throw error;
    }
  }

  async findAll() {
    try {
      const labels = await Label.findAll({
        order: [["name", "ASC"]],
      });
      return labels;
    } catch (error) {
      console.error("Error finding all labels:", error);
      throw error;
    }
  }

  /**
   * @param {Object} labelData 
   * @param {string} labelData.name 
   * @param {string} labelData.description 
   * @returns {Promise<Object>} 
   */
  async create(labelData) {
    try {
      const label = await Label.create(labelData);
      return label;
    } catch (error) {
      console.error("Error creating label:", error);
      throw error;
    }
  }

  /**
   * @param {number} id 
   * @param {Object} updateData 
   * @param {string} updateData.name 
   * @param {string} updateData.description 
   * @returns {Promise<Object|null>} 
   */
  async update(id, updateData) {
    try {
      const label = await Label.findByPk(id);
      if (!label) {
        return null;
      }
      await label.update(updateData);
      return label;
    } catch (error) {
      console.error("Error updating label:", error);
      throw error;
    }
  }

  /**
   * @param {number} id 
   * @returns {Promise<boolean>} 
   */
  async delete(id) {
    try {
      const label = await Label.findByPk(id);
      if (!label) {
        return false;
      }
      await label.destroy();
      return true;
    } catch (error) {
      console.error("Error deleting label:", error);
      throw error;
    }
  }
}

export default new LabelDao();
