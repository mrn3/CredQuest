module.exports = {
  apps: [
    {
      name: 'credquest',
      cwd: '/home/bitnami/CredQuest',
      script: 'server.js',
      env: {
        NODE_ENV: 'production',
        PORT: 3004
      }
    }
  ]
};
