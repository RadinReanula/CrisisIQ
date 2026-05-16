const PARTICLES: { id: number; positionClass: string; animClass: string }[] = [
  { id: 1, positionClass: 'left-[8%] top-[12%]', animClass: 'crisis-particle-1' },
  { id: 2, positionClass: 'left-[22%] top-[28%]', animClass: 'crisis-particle-2' },
  { id: 3, positionClass: 'left-[45%] top-[8%]', animClass: 'crisis-particle-3' },
  { id: 4, positionClass: 'left-[68%] top-[18%]', animClass: 'crisis-particle-4' },
  { id: 5, positionClass: 'left-[88%] top-[32%]', animClass: 'crisis-particle-5' },
  { id: 6, positionClass: 'left-[15%] top-[55%]', animClass: 'crisis-particle-6' },
  { id: 7, positionClass: 'left-[35%] top-[72%]', animClass: 'crisis-particle-7' },
  { id: 8, positionClass: 'left-[58%] top-[48%]', animClass: 'crisis-particle-8' },
  { id: 9, positionClass: 'left-[78%] top-[62%]', animClass: 'crisis-particle-9' },
  { id: 10, positionClass: 'left-[92%] top-[78%]', animClass: 'crisis-particle-10' },
  { id: 11, positionClass: 'left-[5%] top-[85%]', animClass: 'crisis-particle-11' },
  { id: 12, positionClass: 'left-[28%] top-[42%]', animClass: 'crisis-particle-12' },
  { id: 13, positionClass: 'left-[52%] top-[88%]', animClass: 'crisis-particle-13' },
  { id: 14, positionClass: 'left-[72%] top-[38%]', animClass: 'crisis-particle-14' },
  { id: 15, positionClass: 'left-[38%] top-[15%]', animClass: 'crisis-particle-15' },
  { id: 16, positionClass: 'left-[62%] top-[82%]', animClass: 'crisis-particle-16' },
  { id: 17, positionClass: 'left-[82%] top-[52%]', animClass: 'crisis-particle-17' },
  { id: 18, positionClass: 'left-[12%] top-[68%]', animClass: 'crisis-particle-18' },
  { id: 19, positionClass: 'left-[48%] top-[58%]', animClass: 'crisis-particle-19' },
  { id: 20, positionClass: 'left-[95%] top-[12%]', animClass: 'crisis-particle-20' },
];

export function PageBackground() {
  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden"
      aria-hidden
    >
      <div className="crisis-aurora-orb-red absolute -left-32 top-1/4 h-[28rem] w-[28rem] rounded-full bg-red-600 opacity-20 blur-3xl" />
      <div className="crisis-aurora-orb-cyan absolute -right-24 bottom-1/4 h-[32rem] w-[32rem] rounded-full bg-cyan-500 opacity-20 blur-3xl" />
      {PARTICLES.map((p) => (
        <span
          key={p.id}
          className={`crisis-particle absolute h-1 w-1 rounded-full bg-white opacity-30 ${p.positionClass} ${p.animClass}`}
        />
      ))}
    </div>
  );
}
