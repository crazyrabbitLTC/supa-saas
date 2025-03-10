/**
 * @file Home Page
 * @version 0.1.0
 * @status STABLE - DO NOT MODIFY WITHOUT TESTS
 * @lastModified 2023-01-01
 * 
 * Home page for the SaaS application.
 * 
 * IMPORTANT:
 * - This is a placeholder for the actual frontend
 * - Replace with your own implementation
 * 
 * Functionality:
 * - Displays a welcome message
 * - Shows links to documentation
 */

import Link from 'next/link';

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2">
      <main className="flex flex-col items-center justify-center flex-1 px-4 sm:px-20 text-center">
        <h1 className="text-4xl sm:text-6xl font-bold mb-4">
          SaaS-Supabase Boilerplate
        </h1>
        
        <p className="text-xl sm:text-2xl mb-8">
          A comprehensive monorepo boilerplate for SaaS applications built with Supabase
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl w-full">
          <div className="border border-gray-300 dark:border-gray-700 rounded-lg p-6 hover:shadow-md transition-shadow">
            <h2 className="text-2xl font-bold mb-2">API Service</h2>
            <p className="mb-4">
              RESTful API with Fastify, Drizzle ORM, and Supabase integration
            </p>
            <div className="text-sm text-gray-500">
              Status: <span className="text-green-500">Running</span>
            </div>
          </div>
          
          <div className="border border-gray-300 dark:border-gray-700 rounded-lg p-6 hover:shadow-md transition-shadow">
            <h2 className="text-2xl font-bold mb-2">Background Services</h2>
            <p className="mb-4">
              Scheduled jobs and background tasks with node-cron
            </p>
            <div className="text-sm text-gray-500">
              Status: <span className="text-green-500">Running</span>
            </div>
          </div>
        </div>
        
        <div className="mt-12 flex flex-col sm:flex-row gap-4">
          <Link 
            href="https://github.com/your-username/supa-saas"
            className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            target="_blank"
            rel="noopener noreferrer"
          >
            GitHub Repository
          </Link>
          
          <Link 
            href="/docs"
            className="px-6 py-3 bg-gray-200 dark:bg-gray-800 rounded-md hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors"
          >
            Documentation
          </Link>
        </div>
      </main>
      
      <footer className="w-full border-t border-gray-300 dark:border-gray-700 py-4 text-center">
        <p>
          Built with Next.js, Supabase, and Turborepo
        </p>
      </footer>
    </div>
  );
} 