module.exports = {
  apps: [
    {
      name: 'brickcred',
      cwd: '/home/bitnami/BrickCred',
      script: 'server.js',
      env: {
        NODE_ENV: 'production',
        PORT: 3004,
        GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || '1000752158709-vaaghcqbnfns08puunded975pbd9bis4.apps.googleusercontent.com'
      }
    }
  ]
};
