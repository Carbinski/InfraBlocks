# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview
CodeBlocks is a visual cloud infrastructure design tool that enables users to create cloud architectures using drag-and-drop components and automatically generate Terraform code for deployment. The application is built as a React-based web application using Next.js with TypeScript.

## Development Commands

### Package Management
This project uses **pnpm** as the primary package manager (evidenced by `pnpm-lock.yaml`). Use these commands:

```bash
# Install dependencies
pnpm install

# Add new dependencies
pnpm add [package-name]
pnpm add -D [dev-dependency]

# Remove dependencies  
pnpm remove [package-name]
```

### Core Development Commands
```bash
# Start development server
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start

# Run linting
pnpm lint
```

### Testing and Deployment
```bash
# Deploy Terraform infrastructure (from terraform directory)
cd terraform && node deploy.js

# Initialize Terraform
cd terraform && terraform init

# Apply Terraform configuration
cd terraform && terraform apply

# Destroy Terraform resources
cd terraform && terraform destroy
```

## Code Architecture

### Core Application Structure
The application follows Next.js App Router conventions with a component-based architecture:

- **`app/`** - Next.js app router pages and layouts
- **`components/`** - React components organized by feature
- **`hooks/`** - Custom React hooks
- **`lib/`** - Utility functions and configuration
- **`types.ts`** - TypeScript type definitions
- **`terraform/`** - Generated and deployment scripts

### Key Architectural Patterns

#### Visual Canvas System
The core of the application is built around React Flow for the visual canvas:
- **`infrastructure-canvas.tsx`** - Main canvas component using React Flow
- **`cloud-service-node.tsx`** - Custom nodes representing cloud services
- **`connection-edge.tsx`** - Custom edges for service connections
- **Node/Edge State Management** - Uses React Flow's `useNodesState` and `useEdgesState`

#### Service Definition System
Cloud services are defined through a structured configuration system:
- **`service-definitions.ts`** - Defines available cloud services per provider
- **`ConfigField` interface** - Schema for service configuration options
- **Provider-specific services** - AWS, GCP, and Azure service definitions

#### Configuration Management
Dynamic configuration panels for service customization:
- **`configuration-panel.tsx`** - Dynamic form generation based on service schemas
- **`config-loader.ts`** - Loads and manages service configurations
- **Form validation** - Uses Zod and React Hook Form

#### Terraform Code Generation
Automatic infrastructure-as-code generation:
- **`terraform-generator.ts`** - Converts visual diagrams to Terraform
- **Provider-specific generation** - Handles AWS, GCP, Azure resource syntax
- **Resource dependency tracking** - Manages Terraform resource dependencies

#### Project Management
Multi-project workspace functionality:
- **`dashboard.tsx`** - Main project management interface
- **`project-view.tsx`** - Individual project workspace
- **Local state management** - Projects stored in component state

### UI Framework
- **shadcn/ui components** - Configured in `components.json`
- **Tailwind CSS** - Styling with CSS variables and dark mode support
- **Radix UI primitives** - Accessible component foundation
- **Lucide React icons** - Icon system

### Type System
Strong TypeScript integration with comprehensive type definitions:
- **Cloud service types** - `CloudServiceNodeData`, `ConnectionEdgeData`
- **Configuration types** - `ServiceDefinition`, `ConfigField`
- **React Flow integration** - Typed nodes and edges
- **Provider types** - `CloudProvider` union type

### State Management Patterns
- **Local component state** - For UI interactions and temporary data
- **React Flow state** - For canvas nodes and edges
- **Configuration state** - Service-specific configuration management
- **Project persistence** - Local storage patterns for project data

## Development Guidelines

### Component Organization
- Keep components focused and single-responsibility
- Use TypeScript interfaces for all props and data structures
- Implement proper error boundaries for canvas interactions
- Follow the established naming conventions for service IDs

### Service Extension
When adding new cloud services:
1. Define service in `service-definitions.ts` with proper schema
2. Add Terraform generation logic in `terraform-generator.ts`
3. Include connection validation rules in `connection-validator.ts`
4. Update type definitions in `types.ts`

### Terraform Generation
- Maintain provider-specific resource configurations
- Handle resource dependencies through connection analysis
- Generate valid Terraform syntax with proper interpolation
- Include resource tagging and naming conventions

### Canvas Interactions
- Use React Flow's built-in connection validation
- Implement proper drag-and-drop handlers
- Maintain canvas state consistency
- Handle node/edge selection and manipulation

## Configuration Notes

### Next.js Configuration
- **Build error ignoring** - TypeScript and ESLint errors ignored during builds
- **Image optimization disabled** - For static deployment compatibility
- **App Router** - Using Next.js 13+ app directory structure

### Tailwind Configuration
- **shadcn/ui integration** - Component library configuration
- **CSS variables** - Dynamic theming support
- **Custom color scheme** - Neutral base colors
- **Animation support** - Tailwind animate plugin

### Development Environment
- **TypeScript strict mode** - Full type checking enabled
- **ES6 target** - Modern JavaScript features
- **Path aliases** - `@/*` for clean imports
- **Incremental compilation** - Faster TypeScript builds

## File Import Patterns
Use the established path alias system:
- `@/components/*` for React components
- `@/lib/*` for utilities and configuration
- `@/hooks/*` for custom React hooks
- `@/types` for TypeScript type definitions

## Terraform Deployment
The `terraform/` directory contains deployment infrastructure:
- **`deploy.js`** - Node.js deployment script with AWS credential management
- **`aws-config.json`** - AWS credentials configuration file
- **Generated `.tf` files** - Created from visual diagrams
- **State management** - Terraform state files for deployment tracking