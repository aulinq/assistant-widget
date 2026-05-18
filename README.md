# Chat Widget

A production-ready, headless chat widget library built with vanilla TypeScript core and React components.

## Features

- 🎯 **Headless Architecture** - Fully customizable, framework-agnostic core
- 🔌 **WebSocket Real-time** - Bi-directional streaming communication
- ⚛️ **React Components** - Ready-to-use React wrapper components
- 🎨 **Themed UI** - Beautiful default theme included
- 📝 **Markdown Support** - Rich text rendering with marked.js
- 🔄 **Auto-reconnect** - Smart reconnection handling
- 📦 **TypeScript** - Full type safety
- 🎯 **Modern Stack** - React 19, Tailwind CSS v4, Vite

## Installation

```bash
npm install @aulinq/assistant-widget
# or
bun add @aulinq/assistant-widget
```

## Quick Start

### React Component

```tsx
import { ChatWidget } from '@aulinq/assistant-widget/react';

function App() {
  return (
    <ChatWidget
      identityUrl="http://localhost:8100"
      runtimeUrl="http://localhost:8890/v1/chat/stream"
      siteToken="your-site-token"
      title="IO Assistant"
      placeholder="Type a message..."
      theme="default"
      debug={true}
      onClose={() => console.log('Widget closed')}
    />
  );
}
```


### Vanilla JavaScript

```ts
import { ChatService } from '@aulinq/assistant-widget';

const chat = new ChatService(
  {
    identityUrl: 'http://localhost:8100',
    runtimeUrl: 'http://localhost:8890/v1/chat/stream',
    siteToken: 'your-site-token',
    debug: true,
  },
  (event) => {
    console.log('Chat event:', event);
  }
);

// Connect
await chat.connect();

// Send message
await chat.sendMessage('Hello, AI!');

// Disconnect
chat.disconnect();
```

## API Reference

### ChatWidget Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `config` | `ChatConfig` | required | WebSocket configuration |
| `autoConnect` | `boolean` | `true` | Auto-connect on mount |
| `title` | `string` | `'Chat'` | Widget title |
| `placeholder` | `string` | `'Type a message...'` | Input placeholder |
| `theme` | `string` | `'default'` | UI theme |
| `className` | `string` | `''` | Additional CSS classes |
| `onClose` | `() => void` | - | Close handler |

### ChatConfig

```ts
interface ChatConfig {
  siteToken: string;              // Website token from dashboard
  identityUrl?: string;           // identity-service base URL
  runtimeUrl?: string;            // agent-runtime stream or ws URL
  transport?: 'sse' | 'ws';       // default: 'sse'
  serverUrl?: string;             // deprecated runtime fallback
  sessionId?: string;             // Optional session ID
  reconnect?: boolean;            // Enable auto-reconnect (default: true)
  reconnectInterval?: number;     // Reconnect delay in ms (default: 3000)
  maxReconnectAttempts?: number;  // Max reconnect attempts (default: 5)
  debug?: boolean;                // Enable debug logs (default: false)
}
```


### Message Interface

```ts
interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  type?: 'text' | 'audio' | 'control' | 'break' | 'error' | 'status';
  metadata?: Record<string, unknown>;
}
```

## Theming

The widget includes a beautiful default theme. It features:

- Brown gradient background (`#7d5c59` to `#6d5654`)
- Glass-morphism effects
- Smooth animations
- Responsive design
- Dark theme optimized

### Custom Theme

You can create your own theme by extending the CSS:

```css
@theme {
  --color-primary: #your-color;
  --radius-widget: 1rem;
  /* ... other variables */
}

.theme-custom {
  .chat-header {
    background: linear-gradient(135deg, #your-colors);
  }
  /* ... other styles */
}
```

## WebSocket Protocol

The widget authenticates with `POST /v1/chat/handshake`, then sends each text message to agent-runtime. The default transport is SSE via `POST /v1/chat/stream`; WebSocket is available with `transport: 'ws'` and uses `/v1/chat/ws`.

### Runtime events
- `delta`: Partial assistant text.
- `thought`, `tool_call`, `tool_res`, `typing`: Status updates.
- `done`: End of response.
- `error`: Error message.

Realtime voice is handled by the separate `voice-widget` package.

## Development

```bash
# Install dependencies
bun install

# Build library
bun run build

# Watch mode
bun run dev

# Type check
bun run type-check

# Run demo
bun run dev:demo
```

## Demo Pages

The widget includes three demo pages to help you get started:

1. **React Demo** (`/`) - Full-featured React demo with component examples
   - Shows React wrapper usage with `ChatWidget` component
   - Interactive controls and live widget
   - Access: Run `bun run dev:demo` and visit `http://localhost:5173`

2. **Vanilla JS Demo** (`/demo/vanilla.html`) - Pure vanilla JavaScript implementation
   - Shows core `ChatWidget` class usage
   - Headless `ChatService` examples
   - Interactive initialization and controls
   - Access: `http://localhost:5173/demo/vanilla.html`

3. **CDN Embed Example** (`/demo/embed.html`) - Simplest integration method
   - Shows CDN/script tag usage with `embed.js`
   - Interactive script generator with compression
   - Copy-paste ready code
   - Access: `http://localhost:5173/demo/embed.html`

## Project Structure

```
assistant-widget/
├── src/
│   ├── core/              # Headless Core (Vanilla TS)
│   │   ├── services/      # Business logic & API
│   │   ├── store/         # State management
│   │   ├── types/         # Type definitions
│   │   ├── ui/            # UI Controller logic
│   │   └── utils/         # Helpers & Audio logic
│   ├── react/             # React Wrapper
│   │   └── components/    # React-specific components
│   ├── themes/            # UI Themes & Templates
│   │   └── default/       # Default Theme
│   ├── generator.ts       # Dashboard script generator
│   ├── embed.ts           # CDN/Embed entry point
│   └── index.ts           # Main library entry
├── demo/                  # Demo applications
├── dist/                  # Compiled assets
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari 14+

## License

MIT

## Contributing

Contributions are welcome! Please read our contributing guidelines first.

## Credits

Built by Aulinq team with ❤️
