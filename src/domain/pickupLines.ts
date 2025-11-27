// Library of 7 pickup lines for sales agents
import type { PickupLine } from './types';

export const PICKUP_LINES: PickupLine[] = [
  {
    id: 'pl-1',
    text: "Hi, it's  YOUR_NAME from Dis-Chem Life. Thanks for requesting a call back. Is this a convenient time to talk about increasing your Better Rewards?",
    category: 'helpful',
  },
  {
    id: 'pl-2',
    text: "Good morning! I'm calling because I think we have a solution that could save you time and money.",
    category: 'value-focused',
  },
  {
    id: 'pl-3',
    text: "Hi there! I saw you downloaded our guide. What did you think?",
    category: 'engagement',
  },
  {
    id: 'pl-4',
    text: "Hello! I'm reaching out because companies like yours have seen great results with our service.",
    category: 'social-proof',
  },
  {
    id: 'pl-5',
    text: "Hi! Quick question - are you currently happy with your [product/service] provider?",
    category: 'question-based',
  },
  {
    id: 'pl-6',
    text: "Good afternoon! I have some information that could help you achieve your goals faster.",
    category: 'goal-oriented',
  },
  {
    id: 'pl-7',
    text: "Hi! I'm calling to share a limited-time opportunity that might interest you.",
    category: 'urgency',
  },
];
