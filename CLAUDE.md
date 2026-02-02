# CLAUDE.md - AI Assistant Guide for expoiosweb

## Project Overview

**expoiosweb** is a cross-platform application project targeting iOS and web platforms using the Expo framework (React Native). This is currently a greenfield project in its initial setup stage.

### Current State

- **Status**: Newly initialized repository
- **Framework**: Expo (planned - React Native for iOS + Web)
- **Infrastructure**: Not yet configured

## Repository Structure

### Current Structure
```
expoiosweb/
├── .git/              # Git version control
├── README.md          # Project documentation
└── CLAUDE.md          # This file - AI assistant guide
```

### Expected Structure (Once Initialized)
```
expoiosweb/
├── app/               # Expo Router app directory (screens/routes)
│   ├── (tabs)/        # Tab-based navigation group
│   ├── _layout.tsx    # Root layout component
│   └── index.tsx      # Home screen
├── assets/            # Static assets (images, fonts)
├── components/        # Reusable React components
├── constants/         # App constants and configuration
├── hooks/             # Custom React hooks
├── lib/               # Utility libraries and helpers
├── services/          # API services and external integrations
├── stores/            # State management (if using Zustand/Redux)
├── types/             # TypeScript type definitions
├── .expo/             # Expo cache (gitignored)
├── node_modules/      # Dependencies (gitignored)
├── app.json           # Expo app configuration
├── package.json       # Node.js dependencies and scripts
├── tsconfig.json      # TypeScript configuration
├── babel.config.js    # Babel configuration
└── metro.config.js    # Metro bundler configuration
```

## Development Workflows

### Initial Project Setup (Required)

The project needs to be initialized with Expo. Run:
```bash
npx create-expo-app@latest . --template tabs
# OR for a blank template:
npx create-expo-app@latest . --template blank-typescript
```

### Common Development Commands (After Setup)

| Command | Description |
|---------|-------------|
| `npx expo start` | Start the development server |
| `npx expo start --web` | Start for web development |
| `npx expo start --ios` | Start iOS simulator |
| `npm run build` | Build for production |
| `npm test` | Run tests |
| `npm run lint` | Run ESLint |
| `npx expo install <package>` | Install Expo-compatible packages |

### Git Workflow

1. **Branch Naming**: Use descriptive branch names
   - Features: `feature/<description>`
   - Fixes: `fix/<description>`
   - AI branches: `claude/<session-id>`

2. **Commit Messages**: Use conventional commits
   - `feat:` for new features
   - `fix:` for bug fixes
   - `docs:` for documentation
   - `refactor:` for code refactoring
   - `test:` for adding tests

## Code Conventions

### TypeScript

- Use TypeScript for all source files (`.tsx` for components, `.ts` for utilities)
- Enable strict mode in `tsconfig.json`
- Define interfaces/types in `types/` directory for shared types
- Use explicit return types for functions

### React/React Native

- Use functional components with hooks (no class components)
- Follow the component file structure:
  ```typescript
  // Imports
  import { View, Text } from 'react-native';

  // Types
  interface ComponentProps {
    title: string;
  }

  // Component
  export function Component({ title }: ComponentProps) {
    return (
      <View>
        <Text>{title}</Text>
      </View>
    );
  }
  ```

### File Naming

- Components: PascalCase (`UserProfile.tsx`)
- Utilities/hooks: camelCase (`useAuth.ts`, `formatDate.ts`)
- Constants: camelCase file, SCREAMING_SNAKE_CASE for values
- Types: PascalCase (`User.ts`)

### Styling

- Use StyleSheet.create() for React Native styles
- For web-specific styles, use Expo's Platform API
- Consider using NativeWind (Tailwind for React Native) for cross-platform styling

## Key Dependencies (Recommended)

### Core
- `expo` - Expo SDK
- `expo-router` - File-based routing
- `react-native` - React Native framework
- `typescript` - Type safety

### Navigation & UI
- `@expo/vector-icons` - Icon library
- `expo-image` - Optimized image component
- `expo-status-bar` - Status bar management

### State Management
- `zustand` - Lightweight state management (recommended)
- OR `@tanstack/react-query` - Server state management

### Testing
- `jest` - Test runner
- `@testing-library/react-native` - Component testing

## Platform-Specific Considerations

### iOS
- Test on iOS Simulator regularly
- Handle safe areas with `SafeAreaView`
- Follow Apple Human Interface Guidelines

### Web
- Ensure responsive design for various screen sizes
- Test in multiple browsers
- Use `Platform.OS === 'web'` for web-specific code

### Cross-Platform
```typescript
import { Platform } from 'react-native';

const styles = StyleSheet.create({
  container: {
    padding: Platform.select({
      ios: 20,
      web: 16,
      default: 12,
    }),
  },
});
```

## AI Assistant Guidelines

### When Making Changes

1. **Read before editing**: Always read existing files before modifying
2. **Keep changes minimal**: Only change what's necessary for the task
3. **Maintain consistency**: Follow existing patterns in the codebase
4. **Test your changes**: Run relevant tests and verify functionality
5. **Document significant changes**: Update README or comments as needed

### Code Quality

- Avoid introducing security vulnerabilities (XSS, injection, etc.)
- Don't over-engineer solutions
- Keep components focused and single-purpose
- Prefer composition over inheritance

### What NOT to Do

- Don't add unnecessary dependencies
- Don't create files unless essential
- Don't refactor unrelated code
- Don't add features beyond what was requested
- Don't commit untested changes

### Common Tasks

**Adding a new screen:**
1. Create component in `app/` directory
2. Export as default for Expo Router
3. Add navigation if needed in `_layout.tsx`

**Adding a reusable component:**
1. Create in `components/` directory
2. Define TypeScript props interface
3. Export named export
4. Add to component index if using barrel exports

**Adding an API service:**
1. Create in `services/` directory
2. Use async/await patterns
3. Handle errors appropriately
4. Add TypeScript types for responses

## Environment Setup

### Prerequisites
- Node.js 18+ LTS
- npm or yarn
- For iOS: macOS with Xcode installed
- For web: Modern browser

### Environment Variables
```bash
# .env.local (gitignored)
EXPO_PUBLIC_API_URL=https://api.example.com
```

Access via: `process.env.EXPO_PUBLIC_API_URL`

## Troubleshooting

### Common Issues

**Metro bundler issues:**
```bash
npx expo start --clear
```

**Dependencies not resolving:**
```bash
rm -rf node_modules
npm install
npx expo install --fix
```

**TypeScript errors after install:**
```bash
npx expo install --fix
```

## Resources

- [Expo Documentation](https://docs.expo.dev)
- [React Native Documentation](https://reactnative.dev)
- [Expo Router Documentation](https://docs.expo.dev/router/introduction/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
