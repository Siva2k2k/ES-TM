import React from 'react';
import { useTheme, themeClasses } from '../contexts/theme';
import { ThemeToggle } from './ThemeToggle';
import { PageLayout, Section } from './Layout';
import { StatusBadge, StatusAlert } from './StatusComponents';
import { Button } from './ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './ui/Card';
import { Input } from './ui/Input';

/**
 * Theme Test Component
 * Use this component to test and verify dark mode implementation
 * across all theme-aware components
 */
export const ThemeTestPage: React.FC = () => {
  const { theme, resolvedTheme, isDark, colors } = useTheme();

  return (
    <PageLayout
      title="Theme Integration Test"
      subtitle="Test dark mode implementation across all components"
      actions={<ThemeToggle size="md" showLabel={true} />}
    >
      {/* Theme Status */}
      <Section title="Theme Status" className="mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className={`text-sm font-medium ${themeClasses.subheading}`}>Current Theme</p>
                <p className={`text-lg ${themeClasses.heading}`}>{theme}</p>
              </div>
              <div>
                <p className={`text-sm font-medium ${themeClasses.subheading}`}>Resolved Theme</p>
                <p className={`text-lg ${themeClasses.heading}`}>{resolvedTheme}</p>
              </div>
              <div>
                <p className={`text-sm font-medium ${themeClasses.subheading}`}>Is Dark Mode</p>
                <p className={`text-lg ${themeClasses.heading}`}>{isDark ? 'Yes' : 'No'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </Section>

      {/* Button Variants */}
      <Section title="Button Variants" className="mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-wrap gap-4">
              <Button variant="default">Primary Button</Button>
              <Button variant="secondary">Secondary Button</Button>
              <Button variant="destructive">Danger Button</Button>
              <Button variant="outline">Outline Button</Button>
              <Button variant="ghost">Ghost Button</Button>
              <Button variant="link">Link Button</Button>
              <Button disabled>Disabled Button</Button>
              <Button loading>Loading Button</Button>
            </div>
          </CardContent>
        </Card>
      </Section>

      {/* Status Components */}
      <Section title="Status Components" className="mb-8">
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Status Badges</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                <StatusBadge type="success" size="sm">Success</StatusBadge>
                <StatusBadge type="error" size="md">Error</StatusBadge>
                <StatusBadge type="warning" size="lg">Warning</StatusBadge>
                <StatusBadge type="info">Info</StatusBadge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Status Alerts</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <StatusAlert type="success" title="Success Alert">
                This is a success message that indicates everything went well.
              </StatusAlert>
              <StatusAlert type="error" title="Error Alert">
                This is an error message that indicates something went wrong.
              </StatusAlert>
              <StatusAlert type="warning" title="Warning Alert">
                This is a warning message that indicates caution is needed.
              </StatusAlert>
              <StatusAlert type="info" title="Info Alert">
                This is an info message that provides additional information.
              </StatusAlert>
            </CardContent>
          </Card>
        </div>
      </Section>

      {/* Form Elements */}
      <Section title="Form Elements" className="mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Form Controls</CardTitle>
            <CardDescription>Testing form elements with theme support</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="text-input" className={`block text-sm font-medium mb-2 ${themeClasses.subheading}`}>
                  Text Input
                </label>
                <Input id="text-input" placeholder="Enter some text..." />
              </div>
              <div>
                <label htmlFor="email-input" className={`block text-sm font-medium mb-2 ${themeClasses.subheading}`}>
                  Email Input
                </label>
                <Input id="email-input" type="email" placeholder="Enter your email..." />
              </div>
            </div>
          </CardContent>
        </Card>
      </Section>

      {/* Text Styles */}
      <Section title="Typography" className="mb-8">
        <Card>
          <CardContent className="p-6 space-y-4">
            <div>
              <h1 className={`text-3xl font-bold ${themeClasses.heading}`}>Heading 1</h1>
              <h2 className={`text-2xl font-semibold ${themeClasses.heading}`}>Heading 2</h2>
              <h3 className={`text-xl font-medium ${themeClasses.subheading}`}>Heading 3</h3>
            </div>
            
            <div className="space-y-2">
              <p className={themeClasses.body}>
                This is body text that should be clearly readable in both light and dark modes.
                It uses the theme's body text color for optimal contrast.
              </p>
              <p className={themeClasses.muted}>
                This is muted text used for secondary information and descriptions.
                It has lower contrast but should still be readable.
              </p>
              <p className={themeClasses.inverse}>
                This is inverse text, typically used on colored backgrounds.
              </p>
            </div>
          </CardContent>
        </Card>
      </Section>

      {/* Theme Colors Debug */}
      <Section title="Theme Colors Debug" className="mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
              <div>
                <h4 className={`font-medium mb-2 ${themeClasses.subheading}`}>Background</h4>
                <ul className="space-y-1">
                  <li>Primary: <code className={colors.background.primary}>{colors.background.primary}</code></li>
                  <li>Secondary: <code className={colors.background.secondary}>{colors.background.secondary}</code></li>
                  <li>Paper: <code className={colors.background.paper}>{colors.background.paper}</code></li>
                </ul>
              </div>
              
              <div>
                <h4 className={`font-medium mb-2 ${themeClasses.subheading}`}>Text</h4>
                <ul className="space-y-1">
                  <li>Primary: <code className={colors.text.primary}>{colors.text.primary}</code></li>
                  <li>Secondary: <code className={colors.text.secondary}>{colors.text.secondary}</code></li>
                  <li>Muted: <code className={colors.text.muted}>{colors.text.muted}</code></li>
                </ul>
              </div>
              
              <div>
                <h4 className={`font-medium mb-2 ${themeClasses.subheading}`}>Interactive</h4>
                <ul className="space-y-1">
                  <li>Primary: <code className={colors.interactive.primary.base}>{colors.interactive.primary.base}</code></li>
                  <li>Secondary: <code className={colors.interactive.secondary.base}>{colors.interactive.secondary.base}</code></li>
                  <li>Danger: <code className={colors.interactive.danger.base}>{colors.interactive.danger.base}</code></li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </Section>

      {/* Usage Guide */}
      <Section title="Usage Guide">
        <Card>
          <CardHeader>
            <CardTitle>How to Use Theme System</CardTitle>
            <CardDescription>Quick reference for implementing dark mode support</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div>
                <h4 className={`font-medium ${themeClasses.subheading}`}>1. Import Theme Utilities</h4>
                <code className={`block p-2 rounded text-sm ${themeClasses.container} border ${themeClasses.border.default}`}>
                  {`import { useTheme, themeClasses } from '../contexts/theme';`}
                </code>
              </div>
              
              <div>
                <h4 className={`font-medium ${themeClasses.subheading}`}>2. Use Theme Classes</h4>
                <code className={`block p-2 rounded text-sm ${themeClasses.container} border ${themeClasses.border.default}`}>
                  {`<div className={themeClasses.card}>\n  <h1 className={themeClasses.heading}>Title</h1>\n  <p className={themeClasses.body}>Content</p>\n</div>`}
                </code>
              </div>
              
              <div>
                <h4 className={`font-medium ${themeClasses.subheading}`}>3. Use Theme Hook for Dynamic Styling</h4>
                <code className={`block p-2 rounded text-sm ${themeClasses.container} border ${themeClasses.border.default}`}>
                  {`const { isDark, colors } = useTheme();\nreturn <div className={isDark ? 'custom-dark' : 'custom-light'} />;`}
                </code>
              </div>
            </div>
          </CardContent>
        </Card>
      </Section>
    </PageLayout>
  );
};