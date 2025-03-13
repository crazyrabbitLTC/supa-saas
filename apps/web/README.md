# Supa SaaS Dashboard

A modern dashboard built with Next.js, Tailwind CSS, and ShadCN UI components.

## Features

- **Modern Design**: Clean and minimal design with a neutral color scheme
- **Responsive Layout**: Works on all screen sizes from mobile to desktop
- **Dashboard Overview**: See key metrics and recent activity at a glance
- **Profile Management**: Edit personal information and social profiles
- **Settings Panel**: Manage account, notifications, and billing settings
- **Sidebar Navigation**: Easy access to all parts of the application

## Pages

- **Dashboard** (`/dashboard`): Main overview with statistics and recent activity
- **Profile** (`/dashboard/profile`): User profile management
- **Settings** (`/dashboard/settings`): Application and account settings

## Technology Stack

- **Next.js**: React framework for server-rendered applications
- **TypeScript**: Type-safe JavaScript
- **Tailwind CSS**: Utility-first CSS framework
- **ShadCN UI**: High-quality UI components
- **Lucide Icons**: Beautiful and consistent icons

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   pnpm install
   ```
3. Run the development server:
   ```bash
   pnpm dev
   ```
4. Open [http://localhost:3004](http://localhost:3004) in your browser

## Project Structure

```
apps/web/
├── app/              # Next.js app directory (routes)
├── components/       # React components
│   ├── ui/           # ShadCN UI components
│   └── ...           # Application-specific components
├── lib/              # Utility functions and helpers
├── public/           # Static assets
└── src/              # Additional source code
```

## Customization

### Adding New Pages

1. Create a new page in the appropriate directory (e.g., `app/dashboard/new-page/page.tsx`)
2. Use the `SidebarProvider` and `AppSidebar` components for consistent layout
3. Add navigation links in the `AppSidebar` component

### Modifying the UI

- Edit the color scheme in `src/app/globals.css`
- Modify components in the `components/ui` directory
- Update the `AppSidebar` component to change navigation

## License

MIT 