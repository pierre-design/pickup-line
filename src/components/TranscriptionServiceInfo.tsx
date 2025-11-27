import { TranscriptionServiceFactory } from '../infrastructure';

/**
 * Component to display which transcription service is currently active
 * Helps users understand what's being used and how to upgrade
 */
export function TranscriptionServiceInfo() {
  const serviceInfo = TranscriptionServiceFactory.getAvailableServices();

  const getServiceDisplay = () => {
    switch (serviceInfo.current) {
      case 'assemblyai':
        return {
          name: 'AssemblyAI',
          color: 'from-primary to-green-600',
          borderColor: 'border-primary/30',
          bgColor: 'bg-primary/10',
          textColor: 'text-primary',
          icon: '🎯',
          description: 'Professional-grade real-time transcription',
        };
      case 'web-speech':
        return {
          name: 'Web Speech API',
          color: 'from-blue-500 to-blue-600',
          borderColor: 'border-blue-500/30',
          bgColor: 'bg-blue-500/10',
          textColor: 'text-blue-400',
          icon: '🎤',
          description: 'Browser-native speech recognition',
        };
      case 'mock':
        return {
          name: 'Demo Mode',
          color: 'from-secondary to-yellow-500',
          borderColor: 'border-secondary/30',
          bgColor: 'bg-secondary/10',
          textColor: 'text-secondary',
          icon: '🎭',
          description: 'Simulated transcription for testing',
        };
      default:
        return {
          name: 'Unknown',
          color: 'from-gray-500 to-gray-600',
          borderColor: 'border-gray-500/30',
          bgColor: 'bg-gray-500/10',
          textColor: 'text-gray-400',
          icon: '❓',
          description: 'Unknown service',
        };
    }
  };

  const service = getServiceDisplay();

  return (
    <div className={`glass p-4 rounded-xl border ${service.borderColor}`}>
      <div className="flex items-center gap-3">
        <div className={`flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br ${service.color} flex items-center justify-center shadow-medium`}>
          <span className="text-2xl" role="img" aria-label="Service icon">
            {service.icon}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <div className={`font-bold text-sm ${service.textColor}`}>{service.name}</div>
          <div className="text-xs text-white/60 mt-0.5">{service.description}</div>
        </div>
        <div className={`px-2 py-1 rounded-md ${service.bgColor} ${service.textColor} text-xs font-medium`}>
          Active
        </div>
      </div>

      {serviceInfo.current === 'mock' && (
        <div className="mt-4 pt-4 border-t border-white/10">
          <p className="text-xs font-semibold text-white/80 mb-2">Enable real transcription:</p>
          <ul className="space-y-2 text-xs text-white/60">
            {!serviceInfo.webSpeech && (
              <li className="flex items-start gap-2">
                <span className="text-secondary">→</span>
                <span>Use Chrome, Edge, or Safari for Web Speech API</span>
              </li>
            )}
            {!serviceInfo.assemblyAI && (
              <li className="flex items-start gap-2">
                <span className="text-secondary">→</span>
                <div>
                  <span>Add AssemblyAI API key for professional transcription</span>
                  <br />
                  <a
                    href="https://www.assemblyai.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:text-primary/80 underline transition-colors mt-1 inline-block"
                  >
                    Get API key →
                  </a>
                </div>
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
