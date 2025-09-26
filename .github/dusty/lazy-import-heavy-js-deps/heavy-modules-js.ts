// List of heavy JavaScript/TypeScript modules for lazy-import-heavy-js-deps rule
// You can override this list via the HEAVY_MODULES_JS environment variable (comma-separated)

const heavyModulesJs: string[] = [
  // Cloud SDKs (often large)
  "aws-sdk", "@aws-sdk/*", "firebase-admin", "firebase", "@google-cloud/*", "@azure/*",
  // Headless browsers / automation
  "puppeteer", "playwright",
  // Native/binary-heavy
  "sharp", "canvas", "opencv4nodejs", "nodegit",
  // Data/ML in Node
  "@tensorflow/tfjs-node", "onnxruntime-node",
  // PDF/Excel and large utilities
  "pdfkit", "pdf-lib", "xlsx", "exceljs",
  // ORMs / DB clients (can be significant)
  "typeorm", "sequelize", "prisma", "mongoose", "pg", "mysql2",
  // 3D/Graphics
  "three", "babylonjs",
];

export default heavyModulesJs;

