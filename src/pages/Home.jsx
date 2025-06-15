import { Link } from "react-router-dom";
import { BsThreeDotsVertical } from "react-icons/bs";
import Slider from "react-slick";

// Make sure you imported this in App.jsx or main.jsx
// import "slick-carousel/slick/slick.css";
// import "slick-carousel/slick/slick-theme.css";

const Home = () => {
  const giftOption = [
    { id: 1, category: "christmas", icon: "red" },
    { id: 2, category: "birthday", icon: "yellow" },
    { id: 3, category: "thank you", icon: "green" },
    { id: 4, category: "graduation", icon: "white" },
    { id: 5, category: "engagement", icon: "pink" },
    { id: 6, category: "anniversary", icon: "purple" },
  ];

  const slides = [
    {
      text: "Send money as a surprise gift to your friends",
      bg: "bg-purple-600",
    },
    {
      text: "Choose from multiple gift categories",
      bg: "bg-rose-500",
    },
    {
      text: "Customize your message and amount",
      bg: "bg-green-600",
    },
    {
      text: "Get notified when your friend receives the gift",
      bg: "bg-yellow-600 text-black",
    },
  ];

  const settings = {
    dots: true,
    infinite: true,
    speed: 500,
    arrows: false,
    autoplay: true,
    autoplaySpeed: 3000,
    slidesToShow: 1,
    slidesToScroll: 1,
  };

  return (
    <div className="w-full py-2">
      <div className="w-[94%] flex items-center justify-between mx-auto">
        <Link to="/" className="text-blue-600 text-lg">
          Tipex
        </Link>
        <h3 className="text-white">Send a gift</h3>
        <BsThreeDotsVertical className="text-white size-5" />
      </div>

      {/* Carousel section */}
      <div className="w-[90%] mx-auto my-9 rounded-2xl overflow-hidden">
        <Slider {...settings}>
          {slides.map((slide, idx) => (
            <div key={idx}>
              <div
                className={`h-32 flex items-center justify-center text-center px-4 rounded-2xl ${slide.bg}`}
              >
                <p className="text-base sm:text-lg font-semibold">
                  {slide.text}
                </p>
              </div>
            </div>
          ))}
        </Slider>
      </div>

      {/* Gift Options */}
      <div className="w-[94%] mx-auto text-white">
        <h2 className="font-semibold text-base">Gift Options</h2>
        <div className="w-full mt-5 grid grid-cols-2 gap-x-3 gap-y-5">
          {giftOption.map((item) => (
            <Link
              to={`/${item.category}`}
              className="w-[95%] mx-auto"
              key={item.id}
            >
              <div
                className="rounded-2xl h-28 w-full mx-auto"
                style={{ backgroundColor: item.icon }}
              ></div>
              <h4 className="pl-1 capitalize font-semibold pt-0.5 text-sm">
                {item.category}
              </h4>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Home;
