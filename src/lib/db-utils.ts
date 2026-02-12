import connectDB from './mongodb';
import Portfolio from '@/models/Portfolio';
import User from '@/models/User';

/**
 * Database utility functions for testing and development
 */

export async function testConnection() {
  try {
    await connectDB();

    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  }
}

export async function clearDatabase() {
  try {
    await connectDB();
    await Portfolio.deleteMany({});
    await User.deleteMany({});

    return true;
  } catch (error) {
    console.error('❌ Failed to clear database:', error);
    return false;
  }
}

export async function seedDatabase() {
  try {
    await connectDB();
    
    // Check if data already exists
    const existingPortfolios = await Portfolio.countDocuments();
    if (existingPortfolios > 0) {
      return true;
    }

    // Sample portfolio data
    const samplePortfolios = [
      {
        id: 1,
        category: 'web',
        title: 'E-commerce Platform',
        description: 'A modern e-commerce platform built with Next.js and MongoDB',
        fullDescription: 'A comprehensive e-commerce solution featuring user authentication, product management, shopping cart, payment integration, and admin dashboard. Built with modern technologies for optimal performance and user experience.',
        technologies: ['Next.js', 'React', 'MongoDB', 'Stripe', 'Tailwind CSS'],
        image: '/images/ecommerce.jpg',
        demoUrl: 'https://demo-ecommerce.com',
        githubUrl: 'https://github.com/user/ecommerce',
        features: ['User Authentication', 'Product Catalog', 'Shopping Cart', 'Payment Processing', 'Admin Dashboard'],
        duration: '3 months',
        client: 'Tech Startup Inc.'
      },
      {
        id: 2,
        category: 'mobile',
        title: 'Task Management App',
        description: 'Cross-platform mobile app for task and project management',
        fullDescription: 'A feature-rich mobile application that helps teams collaborate and manage projects efficiently. Includes real-time updates, file sharing, team chat, and progress tracking.',
        technologies: ['React Native', 'Firebase', 'Redux', 'TypeScript'],
        image: '/images/taskapp.jpg',
        demoUrl: 'https://demo-taskapp.com',
        githubUrl: 'https://github.com/user/taskapp',
        features: ['Real-time Collaboration', 'File Sharing', 'Team Chat', 'Progress Tracking', 'Push Notifications'],
        duration: '4 months',
        client: 'Corporate Solutions Ltd.'
      },
      {
        id: 3,
        category: 'fullstack',
        title: 'Social Media Dashboard',
        description: 'Analytics dashboard for social media management',
        fullDescription: 'A comprehensive dashboard that aggregates data from multiple social media platforms, providing insights, scheduling capabilities, and performance analytics for social media managers.',
        technologies: ['Node.js', 'Express', 'React', 'PostgreSQL', 'Chart.js'],
        image: '/images/social-dashboard.jpg',
        demoUrl: 'https://demo-social.com',
        githubUrl: 'https://github.com/user/social-dashboard',
        features: ['Multi-platform Integration', 'Analytics Dashboard', 'Content Scheduling', 'Performance Reports', 'Team Collaboration'],
        duration: '5 months',
        client: 'Digital Marketing Agency'
      }
    ];

    // Insert sample portfolios
    await Portfolio.insertMany(samplePortfolios);
    return true;
  } catch (error) {
    console.error('❌ Failed to seed database:', error);
    return false;
  }
}

export async function getDatabaseStats() {
  try {
    await connectDB();
    
    const portfolioCount = await Portfolio.countDocuments();
    const userCount = await User.countDocuments();
    
    
    return {
      portfolios: portfolioCount,
      users: userCount
    };
  } catch (error) {
    console.error('❌ Failed to get database stats:', error);
    return null;
  }
}
