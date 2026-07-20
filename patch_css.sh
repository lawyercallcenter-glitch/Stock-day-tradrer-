cat << 'INNER' >> src/index.css

@layer utilities {
  .animate-marquee {
    animation: marquee 25s linear infinite;
  }
  .hover\:pause:hover {
    animation-play-state: paused;
  }
}

@keyframes marquee {
  0% { transform: translateX(0%); }
  100% { transform: translateX(-33.33%); } /* Shift by exactly 1 set of the 3 cloned arrays */
}
INNER
