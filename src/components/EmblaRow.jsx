"use client";

import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { motion } from "framer-motion";
import EmbaCard from "./EmbaCard";
import { useAnimationPreferences } from "../lib/animations";

const EmblaRow = ({ reverse }) => {
  const { shouldReduceMotion } = useAnimationPreferences();

  const cards = [
    {
      title: "Salary Agent",
      status: "Active",
      schedule: "Monthly",
      amount: "1200 USD₮",
      receiver: "John",
      condition: "if balance > $2000",
    },
    {
      title: "Rent Agent",
      status: "Active",
      schedule: "Monthly",
      amount: "800 USD₮",
      receiver: "Landlord",
      condition: "every 5th",
    },
    {
      title: "Savings Agent",
      status: "Active",
      schedule: "Weekly",
      amount: "100 USD₮",
      receiver: "Vault",
      condition: "every Friday",
    },
    {
      title: "Subscription Agent",
      status: "Active",
      schedule: "Monthly",
      amount: "15 USD₮",
      receiver: "Netflix",
      condition: "every 10th",
    },
  ];

  const [emblaRef] = useEmblaCarousel(
    {
      loop: true,
      dragFree: true,
      direction: reverse ? "rtl" : "ltr",
      align: "start",
    },
    [
      Autoplay({
        delay: 3000,
        stopOnInteraction: false,
        stopOnMouseEnter: false,
      }),
    ],
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.6 }}
    >
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex gap-4">
          {cards.concat(cards).map((card, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{
                delay: i * 0.1,
                duration: 0.4,
              }}
            >
              <EmbaCard {...card} />
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default EmblaRow;
