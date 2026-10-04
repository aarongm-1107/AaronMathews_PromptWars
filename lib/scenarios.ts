import { DecisionInput } from '@/types/blindspot';

export interface DemoScenario {
  id: string;
  label: string;
  badge: string;
  data: DecisionInput;
}

export const DEMO_SCENARIOS: DemoScenario[] = [
  {
    id: 'internship',
    label: '6-Month Internship vs On-Time Graduation',
    badge: 'Featured Demo',
    data: {
      decision: 'Whether to accept an off-cycle 6-month software engineering internship at a mid-sized growth startup or decline it to graduate on time with my cohort.',
      context: 'I am a third-year Computer Science student. I received an offer from a fintech startup (Series B, 90 people) starting next month. Accepting requires taking a formal leave of absence for a semester, delaying my graduation by 6 months. My parents are cautious about disrupting my academic timeline, but my peers say hands-on experience matters 10x more than grades.',
      reasoning: 'I am strongly leaning toward taking the internship. Real-world startup experience will guarantee that I stand out in the job market, and since they are fast-growing, there will definitely be mentorship and modern architecture exposure. Delaying graduation by one semester doesn’t seem like a real downside because nobody in tech cares about graduation dates.',
      priorities: '1. Maximizing future job prospects upon graduation\n2. Hands-on learning and mentorship in modern engineering practices\n3. Maintaining low financial debt and steady momentum\n4. Keeping good standing with university requirements',
    },
  },
  {
    id: 'startup-switch',
    label: 'Leaving Big Tech for a Pre-Seed Startup',
    badge: 'Career Pivot',
    data: {
      decision: 'Leaving my Senior Engineer role at a stable enterprise cloud company to join a 3-person AI startup as founding engineer.',
      context: 'I have spent 4 years at a FAANG-tier company. The compensation is high and predictable ($320k), but the work has become bureaucratic and slow-paced. An ex-colleague just raised a $2M pre-seed round for an agentic developer platform and offered me 6% equity and a $130k base salary.',
      reasoning: 'I want to build from scratch again before I get too comfortable. With the boom in generative AI, missing this window feels like a huge career regret. I believe high equity will outweigh the salary cut within 2 years, and working directly with founders will dramatically accelerate my trajectory.',
      priorities: '1. High career upside and ownership\n2. Cutting-edge technical challenge and autonomy\n3. Maintaining personal financial runway for at least 18 months\n4. Avoiding burnout and preserving health/family balance',
    },
  },
  {
    id: 'tech-rewrite',
    label: 'Full Architecture Rewrite to Microservices',
    badge: 'Engineering Architecture',
    data: {
      decision: 'Deciding whether to halt feature development for 4 months to rewrite our Ruby on Rails monolithic backend into Go-based microservices.',
      context: 'Our web app has 40,000 monthly active users and our team has expanded from 4 to 15 engineers. Recent deployments occasionally slow down or hit database lock contention during traffic spikes. The engineering team is frustrated with technical debt and wants a clean architecture.',
      reasoning: 'If we break the monolith into microservices now, each squad can deploy independently without stepping on each other. Go will solve our CPU bottlenecks and latency issues. A four-month pause on new features is acceptable because our current platform is becoming too fragile to scale.',
      priorities: '1. Improving developer velocity and deployment independence\n2. System stability and sub-100ms latency\n3. Retaining customer satisfaction and business growth\n4. Keeping infrastructure complexity manageable for a 15-person team',
    },
  },
];
