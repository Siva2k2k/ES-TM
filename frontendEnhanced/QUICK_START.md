# Quick Start Guide - Frontend Enhanced

## 🚀 Get Started in 5 Minutes

### Prerequisites
- Node.js 18+ installed
- npm or yarn package manager

---

## Step 1: Install Dependencies

```bash
cd frontendEnhanced
npm install
```

---

## Step 2: Start Development Server

```bash
npm run dev
```

The app will open at `http://localhost:5173`

---

## Step 3: Explore the UI

### What You'll See

1. **Modern Dashboard**
   - Welcome header with your name
   - 4 metric cards showing:
     - Hours this week (with trend)
     - Active projects
     - Pending tasks
     - Completion rate
   - Quick action buttons
   - Recent activity feed

2. **Navigation**
   - **Header** (top): Search, notifications, user menu
   - **Sidebar** (left): Navigate between sections
   - Click the menu icon to collapse/expand

3. **Dark Mode**
   - Currently controlled by system preference
   - Theme toggle coming soon in Settings

---

## 📁 Project Structure Quick Reference

```
src/
├── core/          → Providers (Auth, Theme, API)
├── features/      → Feature modules (Dashboard, etc.)
├── shared/        → Reusable components & utilities
├── styles/        → Global styles
└── App.tsx        → Main app entry
```

---

## 🎨 Using Components

### Button

```tsx
import { Button } from '@/shared/components/ui';

<Button variant="primary" size="md">
  Click Me
</Button>
```

**Variants:** primary, secondary, outline, ghost, danger
**Sizes:** sm, md, lg

### Card

```tsx
import { Card, CardHeader, CardTitle, CardContent } from '@/shared/components/ui';

<Card>
  <CardHeader>
    <CardTitle>My Card</CardTitle>
  </CardHeader>
  <CardContent>
    Content here
  </CardContent>
</Card>
```

### Input

```tsx
import { Input } from '@/shared/components/ui';

<Input
  label="Email"
  type="email"
  placeholder="john@example.com"
/>
```

### Badge

```tsx
import { Badge } from '@/shared/components/ui';

<Badge variant="success">Approved</Badge>
```

**Variants:** primary, success, warning, error, info, gray

---

## 🔧 Development Tips

### Hot Reload
- Changes auto-reload
- Check console for errors
- Use React DevTools for debugging

### Dark Mode Testing
1. Windows: Settings → Personalization → Colors → Dark
2. Mac: System Preferences → General → Appearance → Dark
3. The app will automatically switch!

### TypeScript
- All files are fully typed
- Hover over components to see props
- Auto-completion works everywhere

---

## 📝 Common Tasks

### Add a New Component

1. Create file in appropriate folder:
   ```
   features/yourFeature/components/YourComponent.tsx
   ```

2. Use this template:
   ```tsx
   /**
    * Your Component
    * Description of what it does
    * Cognitive Complexity: X
    */
   import React from 'react';
   import { cn } from '@/shared/utils/cn';

   export interface YourComponentProps {
     // Props here
   }

   export const YourComponent: React.FC<YourComponentProps> = (props) => {
     return (
       <div className="...">
         {/* Content */}
       </div>
     );
   };
   ```

3. Export from index:
   ```tsx
   // index.ts
   export { YourComponent } from './YourComponent';
   ```

### Use the API Client

```tsx
import { apiClient, ENDPOINTS } from '@/core/api';

async function fetchData() {
  try {
    const data = await apiClient.get(ENDPOINTS.timesheets.list);
    console.log(data);
  } catch (error) {
    console.error('Failed:', error);
  }
}
```

### Access Current User

```tsx
import { useAuth } from '@/core/auth';

function MyComponent() {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <div>Please log in</div>;
  }

  return <div>Hello, {user?.full_name}!</div>;
}
```

---

## 🎯 Next Steps

### For Development

1. **Read Documentation**
   - `RESTRUCTURING_GUIDE.md` - Architecture
   - `IMPLEMENTATION_SUMMARY.md` - What's built
   - Component files - Inline docs

2. **Explore Components**
   - Check `src/shared/components/ui/`
   - Try different variants
   - Test dark mode

3. **Build Features**
   - Follow the feature module pattern
   - Keep files < 300 LOC
   - Maintain complexity < 15

### For Production

1. Build the app:
   ```bash
   npm run build
   ```

2. Preview production build:
   ```bash
   npm run preview
   ```

3. Deploy:
   - Build output is in `dist/`
   - Upload to your hosting provider

---

## 🐛 Troubleshooting

### Port Already in Use
```bash
# Change port
npm run dev -- --port 3000
```

### Module Not Found
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### TypeScript Errors
- Check imports are correct
- Verify file paths
- Ensure types are exported

### Dark Mode Not Working
- Check system settings
- Verify `dark:` classes in components
- Clear browser cache

---

## 📚 Resources

### Internal
- `/RESTRUCTURING_GUIDE.md` - Full architecture docs
- `/IMPLEMENTATION_SUMMARY.md` - Implementation details
- `/src/shared/constants/design-tokens.ts` - Design system

### External
- [React Docs](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Lucide Icons](https://lucide.dev)

---

## 💬 Need Help?

1. Check the console for errors
2. Read component JSDoc comments
3. Review example components
4. Check TypeScript types

---

## ✅ Checklist for New Features

- [ ] Component is < 300 LOC
- [ ] Complexity is < 15
- [ ] TypeScript types defined
- [ ] Dark mode supported
- [ ] Props documented
- [ ] Responsive design
- [ ] Accessible (ARIA)
- [ ] No code duplication

---

**Happy Coding! 🎉**

For questions or issues, refer to the full documentation or check existing components for examples.

---

**Version:** 1.0.0
**Last Updated:** 2025-10-06
