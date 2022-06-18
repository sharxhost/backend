// For running in pm2

module.exports = {
  apps: [
    {
      name: "sharx_backend",
      script: "./dist/index.js",
      watch: true,
      env: {
        IN_PM2: true,
      },
    },
  ],
};
