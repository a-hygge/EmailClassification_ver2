import classificationService from "../services/classificationService.js";

class TestClassificationController {
  async showTestPage(req, res) {
    try {
      res.render("pages/test/classifyTest", {
        title: "Test Email Classification",
        layout: "layouts/main",
        currentPage: "test",
        result: null,
        stats: req.session.stats || {}, 
        labels: req.session.labelsWithCount || [],
        selectedLabel: null,
      });
    } catch (error) {
      console.error("Error showing test page:", error);
      res.status(500).send("Server Error");
    }
  }
  
  async testClassify(req, res) {
    try {
      const { title, content } = req.body;
      if (!title || !content) {
        return res.render("pages/test/classifyTest", {
          title: "Test Email Classification",
          layout: "layouts/main",
          currentPage: "test",
          result: null,
          error: "Both title and content are required",
          stats: req.session.stats || {},
          labels: req.session.labelsWithCount || [],
          selectedLabel: null,
        });
      }
      
      // Classify email (multi-label)
      const result = await classificationService.classifyEmail({
        title,
        content,
      });
      
      res.render("pages/test/classifyTest", {
        title: "Test Email Classification",
        layout: "layouts/main",
        currentPage: "test",
        result: {
          ...result,
          inputTitle: title,
          inputContent: content,
        },
        error: null,
        stats: req.session.stats || {},
        labels: req.session.labelsWithCount || [],
        selectedLabel: null,
      });
    } catch (error) {
      console.error("Test classification error:", error);
      res.render("pages/test/classifyTest", {
        title: "Test Email Classification",
        layout: "layouts/main",
        currentPage: "test",
        result: null,
        error: "Classification failed: " + error.message,
        stats: req.session.stats || {},
        labels: req.session.labelsWithCount || [],
        selectedLabel: null,
      });
    }
  }
}

const testClassificationController = new TestClassificationController();

export const { showTestPage, testClassify } = testClassificationController;
export default testClassificationController;
