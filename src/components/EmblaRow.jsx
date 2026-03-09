"use client";

import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import EmbaCard from "./EmbaCard";

const EmblaRow = ({ reverse }) => {
  const cards = [
    {
      title: "Salary Agent",
      status: "Active",
      schedule: "Monthly",
      amount: "1200 USD₮",
      receiver: "John",
      condition: "every 1st if balance > $2000",
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
    <div className="overflow-hidden" ref={emblaRef}>
      <div className="flex gap-4">
        {cards.concat(cards).map((card, i) => (
          <EmbaCard key={i} {...card} />
        ))}
      </div>
    </div>
  );
};

export default EmblaRow;
