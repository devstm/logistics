import app from './app';
import { config } from './config';
import { prisma } from './database';

async function startServer() {
  try {
    // Test database connection
    await prisma.$connect();
    console.log('✅ Connected to database successfully');

    // Start the server
    const server = app.listen(config.port, () => {
      console.log(`🚀 Server running on port ${config.port} in ${config.environment} mode`);
      console.log(`📊 Health check available at http://localhost:${config.port}/health`);
    });

    // Graceful shutdown
    const gracefulShutdown = async (signal: string) => {
      console.log(`\n🛑 Received ${signal}, shutting down gracefully...`);
      
      server.close(async () => {
        console.log('📡 HTTP server closed');
        
        try {
          await prisma.$disconnect();
          console.log('🔌 Database connection closed');
          process.exit(0);
        } catch (error) {
          console.error('❌ Error during database disconnect:', error);
          process.exit(1);
        }
      });
    };

    // Handle shutdown signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Only start server if this file is run directly
if (require.main === module) {
  startServer();
}

export default app;