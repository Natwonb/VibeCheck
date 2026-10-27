export const TRAITS = {
  comedian: { key: "comedian", label: "Comedian", emoji: "😂" },
  wild: { key: "wild", label: "Wild One", emoji: "🔥" },
  mastermind: { key: "mastermind", label: "Mastermind", emoji: "🧠" },
  drama: { key: "drama", label: "Drama Starter", emoji: "🎭" },
  observer: { key: "observer", label: "Quiet Observer", emoji: "🌙" }
};

export const QUIZ_QUESTIONS = [
  {
    id: "q1",
    text: "The group chat has been quiet for 3 hours. You...",
    a: { label: "Send a meme so cursed it revives everyone", trait: "comedian" },
    b: { label: "Read everything, reply to nothing", trait: "observer" }
  },
  {
    id: "q2",
    text: "It's 11pm on a Tuesday. Someone says \"road trip?\"",
    a: { label: "I'm already in the car, bring snacks", trait: "wild" },
    b: { label: "I've made a spreadsheet of costs", trait: "mastermind" }
  },
  {
    id: "q3",
    text: "Your friend tells a story that is clearly about you.",
    a: { label: "Add dramatic sound effects and take over", trait: "drama" },
    b: { label: "Wait for the punchline, then steal it later", trait: "comedian" }
  },
  {
    id: "q4",
    text: "At a party, you can be found...",
    a: { label: "On the balcony with one person, deep in it", trait: "observer" },
    b: { label: "Starting a dance circle nobody asked for", trait: "wild" }
  },
  {
    id: "q5",
    text: "Someone makes a rule you think is dumb. You...",
    a: { label: "Find the loophole in 4 minutes", trait: "mastermind" },
    b: { label: "Make a speech about it, loudly", trait: "drama" }
  },
  {
    id: "q6",
    text: "Your superpower of choice?",
    a: { label: "Making anyone laugh in 5 seconds", trait: "comedian" },
    b: { label: "Reading a room instantly", trait: "mastermind" }
  },
  {
    id: "q7",
    text: "Group photo time. You...",
    a: { label: "Jump into frame last second, upside down", trait: "wild" },
    b: { label: "Direct everyone's angles first", trait: "drama" }
  },
  {
    id: "q8",
    text: "A new person joins the group. Your move?",
    a: { label: "Observe quietly, then decide", trait: "observer" },
    b: { label: "Open with the weirdest fact I know", trait: "comedian" }
  },
  {
    id: "q9",
    text: "Best way to win a board game?",
    a: { label: "Plan three moves ahead in silence", trait: "mastermind" },
    b: { label: "Flip the board dramatically and call it a draw", trait: "wild" }
  },
  {
    id: "q10",
    text: "Your villain origin story starts with...",
    a: { label: "Someone spoiling a surprise I planned", trait: "drama" },
    b: { label: "Being forced to socialize for 6 hours straight", trait: "observer" }
  }
];

export const RESULTS = {
  comedian: {
    key: "comedian",
    title: "The Comedian",
    emoji: "😂",
    tagline: "You're the laugh track of the group.",
    description:
      "You can turn a grocery run into a story people quote for years. You read a room in half a second and know exactly when to break the tension. Your weakness? You'll deflect a serious moment with a joke, then apologize with another joke.",
    color: "from-amber-400 to-pink-500"
  },
  wild: {
    key: "wild",
    title: "The Wild One",
    emoji: "🔥",
    tagline: "You're the reason the plan changed.",
    description:
      "You say yes first and figure out logistics later. Every group needs one person who turns a boring Tuesday into a story, and that's you. Your weakness? Sometimes the plan needed the logistics.",
    color: "from-orange-400 to-rose-500"
  },
  mastermind: {
    key: "mastermind",
    title: "The Mastermind",
    emoji: "🧠",
    tagline: "You already know how this ends.",
    description:
      "You're three steps ahead, quietly noticing everything. You plan the trip, remember the passwords and win the games nobody realized were competitive. Your weakness? Letting other people make decisions without commentary.",
    color: "from-violet-400 to-indigo-500"
  },
  drama: {
    key: "drama",
    title: "The Drama Starter",
    emoji: "🎭",
    tagline: "You bring the plot.",
    description:
      "You feel everything at full volume and tell it beautifully. Group chats are more alive when you're in them, and you never let a story end flat. Your weakness? Sometimes the story was already over.",
    color: "from-fuchsia-400 to-purple-500"
  },
  observer: {
    key: "observer",
    title: "The Quiet Observer",
    emoji: "🌙",
    tagline: "You see everything. You say 12 words.",
    description:
      "You're the calm one with the devastating one-liner. You notice who's left out, who's lying about being fine, and which snack bowl is best. Your weakness? Everyone assumes you're fine with the plan.",
    color: "from-sky-400 to-cyan-500"
  }
};

export function computeResult(answers) {
  const scores = { comedian: 0, wild: 0, mastermind: 0, drama: 0, observer: 0 };
  answers.forEach((trait) => {
    if (scores[trait] !== undefined) scores[trait] += 1;
  });
  let best = "comedian";
  Object.keys(scores).forEach((key) => {
    if (scores[key] > scores[best]) best = key;
  });
  return { resultKey: best, scores };
}