# Dark Mode Integration Guide

## Global Theme System Implementation

This project now has a comprehensive dark mode theme system with the following features:

### Theme Context

- **Location**: `src/contexts/ThemeContext.tsx`
- **Types**: `src/contexts/theme/types.ts`
- **Colors**: `src/contexts/theme/colors.ts`
- **Utils**: `src/contexts/theme/utils.ts`
- **Index**: `src/contexts/theme/index.ts`

### Key Features

1. **Global State Management**: Single source of truth for theme state
2. **Persistent Storage**: Theme preference saved in localStorage and backend
3. **System Theme Support**: Respects user's OS theme preference
4. **Comprehensive Color System**: Predefined color palettes for light and dark modes
5. **Utility Classes**: Helper functions for consistent styling
6. **Theme-aware Components**: Pre-built components with dark mode support

### Usage

#### Basic Hook Usage

```tsx
import { useTheme } from "../contexts/theme";

const MyComponent = () => {
  const { theme, setTheme, isDark, colors } = useTheme();

  return (
    <div className={colors.background.primary}>
      <h1 className={colors.text.primary}>Hello World</h1>
    </div>
  );
};
```

#### Using Theme Classes

```tsx
import { themeClasses } from "../contexts/theme";

const MyComponent = () => {
  return (
    <div className={themeClasses.page}>
      <div className={themeClasses.card}>
        <h1 className={themeClasses.heading}>Title</h1>
        <p className={themeClasses.body}>Content</p>
      </div>
    </div>
  );
};
```

#### Theme Toggle Components

```tsx
import { ThemeToggle, SimpleThemeToggle } from '../components/ThemeToggle';

// Full theme selector (light/dark/system)
<ThemeToggle size="md" showLabel={true} />

// Simple toggle (light/dark only)
<SimpleThemeToggle />
```

### Available Theme Classes

#### Layout Classes

- `themeClasses.page` - Full page background
- `themeClasses.container` - Container background
- `themeClasses.card` - Card/panel styling
- `themeClasses.modal` - Modal styling

#### Text Classes

- `themeClasses.heading` - Main headings
- `themeClasses.subheading` - Sub headings
- `themeClasses.body` - Body text
- `themeClasses.muted` - Muted/secondary text
- `themeClasses.inverse` - Inverse text (for dark backgrounds)

#### Interactive Classes

- `themeClasses.button.primary` - Primary buttons
- `themeClasses.button.secondary` - Secondary buttons
- `themeClasses.button.danger` - Danger/delete buttons
- `themeClasses.button.ghost` - Ghost/minimal buttons
- `themeClasses.input` - Form inputs

#### Status Classes

- `themeClasses.status.error` - Error messages
- `themeClasses.status.warning` - Warning messages
- `themeClasses.status.success` - Success messages
- `themeClasses.status.info` - Info messages

#### Border Classes

- `themeClasses.border.default` - Default borders
- `themeClasses.border.strong` - Strong borders
- `themeClasses.border.focus` - Focus borders

#### Shadow Classes

- `themeClasses.shadow.small` - Small shadows
- `themeClasses.shadow.medium` - Medium shadows
- `themeClasses.shadow.large` - Large shadows

### New Theme-Aware Components

#### Layout Components

```tsx
import { PageLayout, Section, EmptyState } from "../components/Layout";

<PageLayout
  title="Page Title"
  subtitle="Page description"
  actions={<Button>Action</Button>}
>
  <Section title="Section Title">Content here</Section>
</PageLayout>;
```

#### Status Components

```tsx
import { StatusBadge, StatusAlert } from '../components/StatusComponents';

<StatusBadge type="success" size="md">Active</StatusBadge>
<StatusAlert type="error" title="Error">Something went wrong</StatusAlert>
```

### Migration Guide

#### For Existing Components

1. **Import theme utilities**:

   ```tsx
   import { themeClasses, useTheme } from "../contexts/theme";
   ```

2. **Replace hardcoded classes**:

   ```tsx
   // Before
   <div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">

   // After
   <div className={themeClasses.container}>
   <h1 className={themeClasses.heading}>
   ```

3. **Use theme-aware colors**:

   ```tsx
   const { colors, isDark } = useTheme();

   // Dynamic styling based on theme
   <div style={{ backgroundColor: isDark ? '#1f2937' : '#ffffff' }}>
   ```

#### Common Patterns to Replace

**Backgrounds**:

```tsx
// Old
className="bg-white dark:bg-gray-800"
// New
className={themeClasses.container}
```

**Text Colors**:

```tsx
// Old
className="text-gray-900 dark:text-gray-100"
// New
className={themeClasses.heading}
```

**Borders**:

```tsx
// Old
className="border-gray-200 dark:border-gray-700"
// New
className={themeClasses.border.default}
```

**Buttons**:

```tsx
// Old
className="bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
// New
className={themeClasses.button.primary}
```

### Updated Components

The following components have been updated with the new theme system:

- ✅ `ThemeContext.tsx` - Enhanced with comprehensive theme management
- ✅ `Button.tsx` - Updated to use theme classes
- ✅ `Card.tsx` - Updated to use theme classes
- ✅ `CustomReportBuilder.tsx` - Partially updated (header section)
- ✅ `ThemeToggle.tsx` - New component for theme switching
- ✅ `Layout.tsx` - New theme-aware layout components
- ✅ `StatusComponents.tsx` - New theme-aware status components

### Next Steps

1. **Audit all components** in the `components/` folder
2. **Update page components** in the `pages/` folder
3. **Test theme switching** across all pages
4. **Add theme toggle** to navigation/header
5. **Update any custom styling** to use theme system

### Best Practices

1. Always use `themeClasses` instead of hardcoded classes
2. Use the `useTheme` hook for dynamic styling
3. Test both light and dark modes
4. Ensure sufficient color contrast
5. Use semantic color names (primary, secondary, etc.)
6. Leverage the status color system for consistency
