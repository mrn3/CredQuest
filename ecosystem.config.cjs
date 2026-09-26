module.exports = {
  apps: [
    {
      name: 'credquest',
      cwd: '/home/bitnami/CredQuest',
      script: 'server.js',
      env: {
        NODE_ENV: 'production',
        PORT: 3004,
        GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || ''
      }
    }
  ]
};
