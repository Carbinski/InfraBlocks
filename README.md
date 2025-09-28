<p align="center">
  <img src="./logo/image.png" alt="InfraBlocks Logo" >
</p>



# InfraBlocks

InfraBlocks is a modern drag-and-drop infrastructure design platform that lets you visually create, configure, and deploy cloud resources across AWS, GCP, and Azure. With an AI agent called Rex, automated Terraform generation, and real-time deployment capabilities, it simplifies cloud infrastructure management for everyone by removing technical barriers and making powerful tools accessible to all. Whether you’re a beginner exploring cloud services or an experienced developer seeking faster workflows, InfraBlocks provides an intuitive, visual way to build and launch infrastructure without needing deep certifications or complex configuration steps.

![InfraBlocks Demo](https://via.placeholder.com/800x400/0ea5e9/ffffff?text=InfraBlocks+Visual+Infrastructure+Designer)

## ✨ Key Features

### 🎨 **Visual Infrastructure Design**
- **Drag & Drop Interface**: Intuitive canvas for building cloud architectures
- **Multi-Cloud Support**: AWS, Google Cloud Platform, and Microsoft Azure
- **Service Catalog**: Pre-configured cloud services with icons and templates
- **Connection Validation**: Smart connection suggestions and validation
- **Real-time Configuration**: Live editing of resource configurations

### 🤖 **AI-Powered Assistant**
- **Natural Language Processing**: Describe your infrastructure needs in plain English
- **Intelligent Suggestions**: AI recommends optimal architectures and connections
- **Automated Creation**: Generate infrastructure from conversations
- **Best Practices**: Built-in guidance for security and performance

### ⚡ **Infrastructure as Code**
- **Terraform Generation**: Automatic conversion to production-ready Terraform
- **Multi-File Output**: Organized `main.tf`, `variables.tf`, `outputs.tf`, and `providers.tf`
- **Configuration Management**: Visual configuration panels with validation
- **Version Control Ready**: Export clean, maintainable infrastructure code

### 🚀 **Deployment & Management**
- **One-Click Deployment**: Direct deployment to cloud providers
- **Real-time Status**: Live deployment progress and status monitoring
- **Credential Management**: Secure storage and validation of cloud credentials
- **Project Organization**: Multi-project workspace with version history

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **UI Components**: Radix UI, Tailwind CSS, Lucide Icons
- **Canvas**: React Flow (XY Flow) for visual editing
- **AI Integration**: OpenAI GPT for intelligent assistance
- **State Management**: Zustand for global state
- **Validation**: Zod for schema validation
- **Infrastructure**: Terraform generation and deployment
- **Cloud SDKs**: AWS, GCP, and Azure APIs

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm/yarn
- Cloud provider accounts (AWS, GCP, or Azure)
- OpenAI API key (for AI features)

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/CodeBlocks.git
cd CodeBlocks

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your API keys

# Start the development server
npm run dev
```

### Environment Variables

```env
# OpenAI Configuration (for AI features)
OPENAI_API_KEY=your_openai_api_key_here

# Optional: Custom API endpoints
NEXT_PUBLIC_API_URL=http://localhost:3000
```

## 📖 Usage

### 1. Create a New Project
- Click "Create Project" on the dashboard
- Choose your cloud provider (AWS, GCP, or Azure)
- Name your project and add a description

### 2. Design Your Infrastructure
- **Drag & Drop**: Drag services from the sidebar to the canvas
- **Connect Services**: Click and drag between service handles to create connections
- **Configure Resources**: Double-click any service to open its configuration panel
- **Use AI Assistant**: Click the brain icon to get AI-powered suggestions

### 3. Generate Terraform Code
- View auto-generated Terraform in the right panel
- Switch between `main.tf`, `variables.tf`, `outputs.tf`, and `providers.tf`
- Download individual files or complete Terraform package

### 4. Deploy Infrastructure
- Set up cloud credentials in Settings
- Click the play button to deploy directly to your cloud provider
- Monitor deployment progress in real-time

### 5. AI-Powered Workflow
- **Ask for Help**: "Create a web application with database and load balancer"
- **Get Recommendations**: AI suggests optimal service configurations
- **Auto-Generate**: Convert conversations into visual infrastructure
- **Best Practices**: Receive guidance on security and performance

## 🏗️ Supported Services

### AWS Services
- **Compute**: EC2, Lambda, Auto Scaling Groups
- **Storage**: S3, EBS, EFS
- **Database**: RDS, DynamoDB
- **Networking**: VPC, ALB, API Gateway
- **Messaging**: SQS, SNS
- **Security**: IAM, Security Groups

### GCP Services
- **Compute**: Compute Engine, Cloud Functions
- **Storage**: Cloud Storage, Persistent Disks
- **Database**: Cloud SQL, Firestore
- **Networking**: VPC, Load Balancers

### Azure Services
- **Compute**: Virtual Machines, Azure Functions
- **Storage**: Blob Storage, Managed Disks
- **Database**: Azure SQL, Cosmos DB
- **Networking**: Virtual Network, Application Gateway

## 🤖 AI Assistant Commands

The AI assistant understands natural language requests:

```
"Create a web application architecture"
"Add a database to my current setup"
"Set up monitoring for my services"
"What's the best way to scale this architecture?"
"Generate a CI/CD pipeline"
"Review my architecture for security best practices"
```

## 📁 Project Structure

```
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── components/            # React components
│   ├── agent-chat.tsx     # AI assistant chat
│   ├── cloud-service-node.tsx # Visual service nodes
│   ├── dashboard.tsx      # Main dashboard
│   ├── infrastructure-canvas.tsx # Visual editor
│   ├── terraform-generator.ts # Terraform code generation
│   └── ui/               # UI components
├── lib/                   # Utility libraries
│   ├── api-service.ts     # Cloud API integrations
│   ├── config-loader.ts   # Service configurations
│   ├── credential-manager.ts # Secure credential storage
│   ├── infrastructure-manager.ts # Canvas state management
│   └── openai-agent.ts    # AI integration
├── types/                 # TypeScript type definitions
└── public/               # Static assets
    └── aws/              # Cloud service icons
    └── gcp/
    └── azure/
```

## 🔧 Configuration

### Cloud Provider Setup

1. **AWS**: Configure access keys in Settings → Cloud Credentials
2. **GCP**: Set up service account JSON credentials
3. **Azure**: Configure subscription and service principal credentials

### Service Customization

Add new services by creating configuration files in `/lib/services/`:

```json
{
  "id": "new-service",
  "name": "New Service",
  "icon": "/path/to/icon.svg",
  "category": "Compute",
  "description": "Service description",
  "terraformType": "resource_type",
  "configSchema": {
    "instance_type": {
      "type": "select",
      "label": "Instance Type",
      "options": ["t3.micro", "t3.small", "t3.medium"]
    }
  }
}
```

## 🧪 Development

### Running Tests

```bash
# Run unit tests
npm test

# Run integration tests
npm run test:integration

# Run end-to-end tests
npm run test:e2e
```

### Build for Production

```bash
# Build the application
npm run build

# Start production server
npm start
```

### Docker Support

```bash
# Build Docker image
docker build -t infrablocks .

# Run container
docker run -p 3000:3000 -e OPENAI_API_KEY=your_key infrablocks
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Setup

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes and add tests
4. Commit your changes: `git commit -m 'Add amazing feature'`
5. Push to the branch: `git push origin feature/amazing-feature`
6. Open a Pull Request

### Code Style

- We use ESLint and Prettier for code formatting
- Run `npm run lint` to check code style
- Run `npm run format` to auto-format code

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- 📧 Email: support@infrablocks.dev
- 💬 Discord: [Join our community](https://discord.gg/infrablocks)
- 🐛 Issues: [GitHub Issues](https://github.com/yourusername/CodeBlocks/issues)
- 📖 Docs: [Documentation](https://docs.infrablocks.dev)

## 🚀 Roadmap

- [ ] **Multi-region deployment support**
- [ ] **Infrastructure cost estimation**
- [ ] **Team collaboration features**
- [ ] **Custom service templates**
- [ ] **Integration with GitOps workflows**
- [ ] **Infrastructure testing and validation**
- [ ] **Kubernetes support**
- [ ] **Infrastructure drift detection**

## 🙏 Acknowledgments

- [React Flow](https://reactflow.dev/) for the amazing visual editing experience
- [Radix UI](https://www.radix-ui.com/) for accessible UI components
- [OpenAI](https://openai.com/) for AI capabilities
- [Terraform](https://www.terraform.io/) for infrastructure as code
- All the amazing open-source contributors

---

**Built with ❤️ by the InfraBlocks team**

*Transform your cloud infrastructure with visual design and AI assistance*
