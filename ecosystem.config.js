module.exports = {
    apps: [
        {
            // Application name
            name: 'workorder-tracking',

            // Script to execute
            script: './server.js',

            // Application mode (cluster if you want multi-core)
            instances: 'max',
            exec_mode: 'cluster',

            // Environment variables
            env: {
                NODE_ENV: 'production',
                PORT: 3000,
                SERVER_IP: '192.168.1.139'
            },

            // Logging
            out_file: '/var/log/pm2/workorder-tracking.log',
            error_file: '/var/log/pm2/workorder-tracking-error.log',
            log_date_format: 'YYYY-MM-DD HH:mm:ss Z',

            // Auto restart
            autorestart: true,

            // Max memory allowed (adjust based on server capacity)
            max_memory_restart: '1G',

            // Watch & ignore
            watch: false, // Set to true only for development
            ignore_watch: ['node_modules', 'uploads', 'logs'],

            // Graceful shutdown
            kill_timeout: 5000,

            // Min uptime before restart
            min_uptime: '10s',

            // Max restarts per minute (0 = unlimited)
            max_restarts: 10,

            // Merge logs from all instances
            merge_logs: true,

            // Listen events (for systemd integration)
            listen_timeout: 10000,
            shutdown_delay: 5000
        }
    ],

    // Deploy configuration for systemd
    deploy: {
        production: {
            user: 'www-data',
            host: '192.168.1.139',
            key: '~/.ssh/id_rsa',
            ref: 'origin/main',
            repo: 'https://github.com/lnwsathit/bst-wot.git',
            path: '/var/www/workorder-tracking',
            'post-deploy': 'npm install --production && pm2 restart ecosystem.config.js --env production'
        }
    }
};
