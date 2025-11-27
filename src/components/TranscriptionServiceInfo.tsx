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
          color: 'text-green-700 bg-green-50 border-green-200',
          icon: '🎯',
          description: 'Professional-grade real-time transcription',
        };
      case 'web-speech':
        return {
          name: 'Web Speech API',
          color: 'text-blue-700 bg-blue-50 border-blue-200',
          icon: '🎤',
          description: 'Browser-native speech recognition',
        };
      case 'mock':
        return {
          name: 'Demo Mode',
          color: 'text-orange-700 bg-orange-50 border-orange-200',
          icon: '🎭',
          description: 'Simulated transcription for testing',
        };
      default:
        return {
          name: 'Unknown',
          color: 'text-gray-700 bg-gray-50 border-gray-200',
          icon: '❓',
          description: 'Unknown service',
        };
    }
  };

  const service = getServiceDisplay();

  return (
    <div className={`p-3 rounded-lg border ${service.color} text-xs sm:text-sm`}>
      <div className="flex items-center gap-2">
        <span className="text-base" role="img" aria-label="Service icon">
          {service.icon}
        </span>
        <div className="flex-1">
          <div className="font-semibold">{service.name}</div>
          <div className="text-xs opacity-90">{service.description}</div>
        </div>
      </div>

      {serviceInfo.current === 'mock' && (
        <div className="mt-2 pt-2 border-t border-current/20 text-xs">
          <p className="font-medium mb-1">To enable real transcription:</p>
          <ul className="space-y-1 ml-4 list-disc">
            {!serviceInfo.webSpeech && (
              <li>Use Chrome, Edge, or Safari for Web Speech API</li>
            )}
            {!serviceInfo.assemblyAI && (
              <li>
                Add AssemblyAI API key to use professional transcription
                <br />
                <a
                  href="https://www.assemblyai.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:no-underline"
                >
                  Get API key →
                </a>
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
