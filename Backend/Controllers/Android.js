const path = require("path");

const getAPK = async (req, res) => {
  const filePath = path.join(__dirname, "../public/app-release.apk");
  res.setHeader("Content-Type", "application/vnd.android.package-archive");
  res.setHeader("Content-Disposition", "attachment; filename=app-release.apk");
  res.download(filePath);
};

module.exports = getAPK;
