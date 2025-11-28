// Library of 7 pickup lines for sales agents
import type { PickupLine } from './types';

export const PICKUP_LINES: PickupLine[] = [
  {
    id: 'pl-1',
    text: "Hi, thank you for requesting a callback from Dis-Chem Life. My name is {your name}. Is this a good time to talk about cover?",
    category: 'rewarding',
  },
  {
    id: 'pl-2',
    text: "Hello, my name is {your name}. You wanted to know more about Dis-Chem Cover. Is now a good time to talk?",
    category: 'helpful',
  },
  {
    id: 'pl-3',
    text: "Hello, I'm {your name}. You wanted to find out more about Dis-Chem Life. Is now a good time to talk about how you can save more at Dis-Chem?",
    category: 'engagement',
  },
  {
    id: 'pl-4',
    text: "Hi, it's {your name} from Dis-Chem Life. You asked for more information, and I'm here to help. Can we talk?",
    category: 'answers',
  },
  {
    id: 'pl-5',
    text: "Hi, it's {your name} from Dis-Chem Life. I'm here to answer your questions and help you choose cover that helps you save. Is this a good time?",
    category: 'savings',
  },
  {
    id: 'pl-6',
    text: "Hello, it's {your name} from Dis-Chem Life. How are you today? I'm also well, thank you. Do you have a couple of minutes to talk?",
    category: 'traditional',
  },
  {
    id: 'pl-7',
    text: "You wanted to find out more about Dis-Chem Life. My name is {your name}. What cover are you interested in?",
    category: 'short',
  },
];