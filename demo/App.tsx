import { ChatWidget } from '../src/react';

export function App() {
  return (
    <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center relative overflow-hidden font-sans">
      {/* Premium background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/10 blur-[120px] rounded-full animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      <div className="z-10 text-center mb-24">
        <h1 className="text-4xl font-light text-white/90 mb-4 tracking-tight">
          Assistant Test
        </h1>
        <div className="h-px w-12 bg-white/20 mx-auto mb-6"></div>
        <p className="text-white/40 text-sm font-light uppercase tracking-[0.2em]">
          Voice Protocol Active
        </p>
      </div>

      <div className="relative z-10 flex items-center justify-center">
        <ChatWidget
          identityUrl={import.meta.env.VITE_IDENTITY_URL || 'http://localhost:8100'}
          runtimeUrl={import.meta.env.VITE_RUNTIME_URL || 'http://localhost:8890/v1/chat/stream'}
          siteToken={import.meta.env.VITE_SITE_TOKEN || 'example_12345'}
          debug={true}
          reconnect={true}
          lang="en"
          theme="default"
          variant="brown"
          className="!static !inset-auto transform scale-[3] hover:scale-[3.1] transition-transform duration-500"
        />
      </div>

      <div className="absolute bottom-12 left-0 w-full text-center z-10">
        <p className="text-white/20 text-xs font-light uppercase tracking-widest">
          Aulinq Assistant v1.0
        </p>
      </div>
    </div>
  );
}
