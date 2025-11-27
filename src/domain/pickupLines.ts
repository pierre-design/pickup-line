// Library of 7 pickup lines for sales agents
import type { PickupLine } from './types';

export const PICKUP_LINES: PickupLine[] = [
  {
    id: 'pl-1',
    text: "Hi, thank you for requesting a callback from Dis-Chem Life. I'm YOUR_NAME. Is this a good time to talk about how you can increase your Better Rewards with our cover?",
    category: 'rewarding',
  },
  {
    id: 'pl-2',
    text: "Hello, it's YOUR_NAME. I'm calling to answer all your questions about Dis-Chem Cover. Is it a convenient time?",
    category: 'helpful',
  },
  {
    id: 'pl-3',
    text: "Hello, it's YOUR_NAME. You wanted to find out more about Dis-Chem Life. Can I start by how it can help you save every time you shop at Dis-Chem.",
    category: 'engagement',
  },
  {
    id: 'pl-4',
    text: "Hi, it's YOUR_NAME from Dis-Chem Life. You asked for more info and I'm here to answer your questions. Can we talk?",
    category: 'answers',
  },
  {
    id: 'pl-5',
    text: "Hello, it's YOUR_NAME from Dis-Chem Life. I'm here to answer your questions and help you cover your family without spending too much. Is this a good time?",
    category: 'savings',
  },
  {
    id: 'pl-6',
    text: "Good morning, it's YOUR_NAME calling from Dis-Chem Life. How are you today? I'm also well, thank you. Do you have five minutes to talk about the cover you asked about?",
    category: 'traditional',
  },
  {
    id: 'pl-7',
    text: "Good morning, it's YOUR_NAME calling from Dis-Chem Life. Can we chat about the cover you asked about?",
    category: 'short',
  },
];
