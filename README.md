# Pickup Line Coach

A real-time feedback application that helps sales agents improve their call opening techniques through speech recognition, performance tracking, and adaptive recommendations.

## Features

- **Real-time Speech Recognition**: Uses Web Speech API (browser-native) to detect which pickup line you use
- **Performance Tracking**: Track success rates for each pickup line
- **Adaptive Recommendations**: System learns which lines work best and suggests alternatives
- **Duolingo-inspired UX**: Encouraging feedback with celebration animations
- **Apple Design Aesthetics**: Clean, modern interface with smooth animations
- **Comprehensive Testing**: 156 unit tests with 100% pass rate
- **No API Keys Required**: Works out of the box in all modern browsers

## Tech Stack

- **Frontend**: React 19 + TypeScript
- **Styling**: Tailwind CSS 4
- **Animations**: Framer Motion
- **Speech Recognition**: Web Speech API (browser-native)
- **Testing**: Vitest + Testing Library
- **Build Tool**: Vite

## Getting Started

### Prerequisites

- Node.js 20+ 
- npm or yarn
- Modern browser (Chrome, Edge, or Safari for Web Speech API)

### No Setup Required!

The app uses Web Speech API which is built into modern browsers. No API keys or external services needed!

### Installation

```bash
# Clone the repository
git clone https://github.com/pierre-design/pickup-line.git
cd pickup-line

# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at `http://localhost:5173`

### Building for Production

```bash
npm run build
npm run preview
```

## Speech Recognition Setup

The app automatically selects the best available transcription service:

### Option 1: Web Speech API (Default - FREE)

- Works out of the box in Chrome, Edge, and Safari
- No configuration needed
- Real-time transcription
- Privacy-friendly (runs locally in browser)

### Option 2: AssemblyAI (Professional - Paid)

For better accuracy and cross-browser support:

1. Sign up at [AssemblyAI](https://www.assemblyai.com/)
2. Get your API key
3. Create a `.env` file in the project root:

```bash
VITE_ASSEMBLYAI_API_KEY=your_api_key_here
```

4. Restart the development server

The app will automatically use AssemblyAI when an API key is detected.

### Option 3: Mock Service (Development)

If neither service is available, the app falls back to a mock service for testing the UI.

## Usage

1. **Start a Call**: Click "Start Call" to begin a new session
2. **Speak Your Opener**: Use one of the pickup lines from the library
3. **End the Call**: Click "End Call" when the conversation concludes
4. **Review Feedback**: See your performance and get suggestions
5. **Track Progress**: View statistics in the Performance tab

## Project Structure

```
src/
├── components/          # React UI components
├── domain/             # Business logic (pickup line matching, outcome classification)
├── infrastructure/     # External services (transcription, storage)
├── services/           # Application services (session management, analytics)
├── types/              # TypeScript type definitions
└── utils/              # Utility functions
```

## Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with UI
npm run test:ui
```

## Architecture

The application follows a clean architecture pattern with clear separation of concerns:

- **UI Layer**: React components with accessibility features
- **Application Layer**: Session management, feedback generation, performance analysis
- **Domain Layer**: Core business logic (pickup line matching, outcome classification)
- **Infrastructure Layer**: External services (speech recognition, data persistence)

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import the project in Vercel
3. Vercel will auto-detect the Vite configuration
4. (Optional) Add `VITE_ASSEMBLYAI_API_KEY` environment variable in Vercel settings
5. Deploy!

### Other Platforms

The app is a static site that can be deployed anywhere:

```bash
npm run build
# Deploy the 'dist' folder to your hosting provider
```

## Browser Support

- **Chrome/Edge**: Full support (Web Speech API + AssemblyAI)
- **Safari**: Full support (Web Speech API + AssemblyAI)
- **Firefox**: AssemblyAI only (Web Speech API not supported)
- **Mobile**: iOS Safari and Chrome for Android supported

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - feel free to use this project for your own purposes.

## Acknowledgments

- Design inspired by Apple Human Interface Guidelines
- UX patterns inspired by Duolingo
- Built with modern web technologies and best practices

## Support

For issues or questions, please open an issue on GitHub.
