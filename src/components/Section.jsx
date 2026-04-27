import EmblaRow from "./EmblaRow";

const Section = () => {
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
    {
      title: "Investment Agent",
      status: "Active",
      schedule: "Monthly",
      amount: "500 USD₮",
      receiver: "Broker",
      condition: "if profit > 5%",
    },
    {
      title: "Utility Agent",
      status: "Active",
      schedule: "Monthly",
      amount: "200 USD₮",
      receiver: "Electric Company",
      condition: "every 15th",
    },
    {
      title: "Groceries Agent",
      status: "Active",
      schedule: "Weekly",
      amount: "150 USD₮",
      receiver: "Supermarket",
      condition: "every Saturday",
    },
    {
      title: "Transport Agent",
      status: "Active",
      schedule: "Weekly",
      amount: "50 USD₮",
      receiver: "Transit Card",
      condition: "every Monday",
    },
    {
      title: "Insurance Agent",
      status: "Active",
      schedule: "Monthly",
      amount: "300 USD₮",
      receiver: "Insurance Co.",
      condition: "every 20th",
    },
    {
      title: "Charity Agent",
      status: "Active",
      schedule: "Monthly",
      amount: "100 USD₮",
      receiver: "NGO",
      condition: "every 1st",
    },
    {
      title: "Education Agent",
      status: "Active",
      schedule: "Monthly",
      amount: "400 USD₮",
      receiver: "Online Course",
      condition: "every 12th",
    },
    {
      title: "Emergency Fund Agent",
      status: "Active",
      schedule: "Weekly",
      amount: "75 USD₮",
      receiver: "Savings Vault",
      condition: "every Sunday",
    },
  ];
  const midpoint = Math.ceil(cards.length / 2);

  const firstRow = cards.slice(0, midpoint);
  const secondRow = cards.slice(midpoint);

  return (
    <div className="space-y-6">
      <EmblaRow data={firstRow} reverse={false} />
      <EmblaRow data={secondRow} reverse />
    </div>
  );
};

export default Section;
