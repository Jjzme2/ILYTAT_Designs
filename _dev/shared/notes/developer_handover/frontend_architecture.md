# Frontend Architecture Documentation

**Last Updated:** March 10, 2025

## Overview

The ILYTAT Designs frontend is built with Vue.js and Vite, following a mobile-first approach with a focus on performance, accessibility, and user experience. This document outlines the frontend architecture, key components, and development practices.

## Technology Stack

- **Framework**: Vue.js 3 with Composition API
- **Build Tool**: Vite
- **State Management**: Pinia
- **Routing**: Vue Router
- **CSS Approach**: Modular CSS files (avoiding scoped styles)
- **HTTP Client**: Axios
- **Testing**: Vitest and Cypress

## Directory Structure

```
app/client/
├── public/              # Static assets served as-is
├── src/
│   ├── assets/          # Static assets that will be processed
│   │   ├── css/         # Global CSS files
│   │   └── images/      # Image assets
│   ├── components/      # Reusable Vue components
│   │   ├── common/      # Shared components (buttons, inputs, etc.)
│   │   ├── layout/      # Layout components (header, footer, etc.)
│   │   └── features/    # Feature-specific components
│   ├── composables/     # Vue composables (reusable logic)
│   ├── config/          # Configuration files
│   ├── router/          # Vue Router configuration
│   ├── services/        # API services and external integrations
│   ├── stores/          # Pinia stores for state management
│   ├── utils/           # Utility functions
│   ├── views/           # Page components
│   ├── App.vue          # Root component
│   └── main.js          # Application entry point
├── tests/
│   ├── unit/            # Unit tests
│   └── e2e/             # End-to-end tests
└── index.html           # HTML entry point
```

## Core Architectural Principles

### 1. Mobile-First Approach

The application is designed with mobile users as the primary target, then progressively enhanced for larger screens:

- Base styles target mobile devices
- Media queries add complexity for larger screens
- Touch-friendly UI elements throughout
- Performance optimization for mobile networks

### 2. Component Architecture

Components follow a hierarchical structure:

- **Atomic Design Methodology**:
  - Atoms: Basic UI elements (buttons, inputs)
  - Molecules: Simple component combinations
  - Organisms: Complex UI sections
  - Templates: Page layouts
  - Pages: Complete views

- **Component Guidelines**:
  - Single responsibility principle
  - Props for data input
  - Events for communication
  - Slots for content distribution
  - Composition API for logic organization

### 3. State Management

Pinia is used for state management with a modular approach:

- **Store Organization**:
  - Feature-based stores (user, products, cart, etc.)
  - Clear separation of state, getters, and actions
  - Composition API integration

- **State Access Patterns**:
  - Direct store imports in components
  - Composables for complex state interactions
  - Persistent state for user preferences and cart

### 4. Styling Approach

CSS is organized in modular files rather than using scoped styles:

- **CSS Structure**:
  - Base styles for global elements
  - Component-specific CSS modules
  - Utility classes for common patterns
  - Variables for theming and consistency

- **Responsive Design**:
  - Fluid layouts with CSS Grid and Flexbox
  - Relative units (rem, em, %) for scalability
  - Breakpoints defined in variables
  - Feature queries for progressive enhancement

## Key Components and Features

### Authentication Flow

- Login/registration forms with validation
- JWT token management
- Protected routes
- User profile management

### Product Catalog

- Dynamic product listings
- Filtering and sorting
- Product detail pages
- Image galleries and zoom functionality

### Shopping Cart

- Add/remove items
- Quantity adjustments
- Persistent cart storage
- Price calculations

### Checkout Process

- Multi-step checkout flow
- Address validation
- Stripe Elements integration
- Order confirmation

## Performance Optimization

### Code Splitting

- Route-based code splitting
- Dynamic imports for large components
- Lazy loading for off-screen content

### Asset Optimization

- Image optimization pipeline
- WebP format with fallbacks
- Responsive images with srcset
- Font loading optimization

### Caching Strategy

- Service worker for offline support
- Local storage for user preferences
- API response caching

## Accessibility Considerations

- WCAG 2.1 AA compliance target
- Semantic HTML structure
- Keyboard navigation support
- Screen reader compatibility
- Color contrast requirements
- Focus management

## Testing Strategy

### Unit Testing

- Component testing with Vitest
- Store and composable testing
- Mock implementations for external dependencies

### End-to-End Testing

- Critical user flows with Cypress
- Visual regression testing
- Cross-browser compatibility

## Development Workflow

### Component Development

1. Define component requirements
2. Create component structure
3. Implement base functionality
4. Add styling
5. Write unit tests
6. Document usage examples

### Feature Implementation

1. Define user stories and acceptance criteria
2. Design component architecture
3. Implement API services
4. Develop UI components
5. Connect to state management
6. Write tests
7. Perform accessibility audit

## Common Patterns and Best Practices

### API Communication

- Centralized API service layer
- Request/response interceptors
- Error handling middleware
- Loading and error states

### Form Handling

- Composable form validation
- Field-level validation
- Form submission handling
- Error message display

### Responsive Layouts

- Container components for layout management
- CSS Grid for page structure
- Flexbox for component alignment
- Media query mixins for consistency

## Known Issues and Future Improvements

- Performance optimization for image-heavy pages
- Enhanced offline support
- Improved animation system
- Expanded unit test coverage

## Resources and References

- [Vue.js Documentation](https://vuejs.org/guide/introduction.html)
- [Vite Documentation](https://vitejs.dev/guide/)
- [Pinia Documentation](https://pinia.vuejs.org/introduction.html)
- [WCAG Guidelines](https://www.w3.org/WAI/standards-guidelines/wcag/)
