import { useEffect } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { motion } from "framer-motion";
import EmbaCard from "./EmbaCard";
import { useAnimationPreferences } from "../lib/animations";

const EmblaRow = ({ data = [], reverse = false }) => {
  const { shouldReduceMotion } = useAnimationPreferences();

  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true,
    align: "start",
  });

  useEffect(() => {
    if (!emblaApi || shouldReduceMotion) return;

    const interval = setInterval(() => {
      if (reverse) {
        emblaApi.scrollPrev();
      } else {
        emblaApi.scrollNext();
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [emblaApi, reverse, shouldReduceMotion]);

  return (
    <motion.div
      initial={shouldReduceMotion ? {} : { opacity: 0, y: 30 }}
      whileInView={shouldReduceMotion ? {} : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.6 }}
    >
      <div className="overflow-hidden">
        <div ref={emblaRef}>
          <div className="flex gap-4">
            {data.map((card) => (
              <motion.div
                key={card.title}
                initial={shouldReduceMotion ? {} : { opacity: 0, scale: 0.9 }}
                animate={shouldReduceMotion ? {} : { opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
                className="flex-[0_0_100%] sm:flex-[0_0_50%] lg:flex-[0_0_33.33%]"
              >
                <EmbaCard {...card} />
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default EmblaRow;
