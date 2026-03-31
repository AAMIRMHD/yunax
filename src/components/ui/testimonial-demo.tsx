import { TestimonialCarousel } from "@/components/ui/testimonial";

const TESTIMONIAL_DATA = [
  {
    id: 1,
    name: "Ava Patel",
    avatar: "https://images.unsplash.com/photo-1502685104226-ee32379fefbe?auto=format&fit=crop&w=300&q=80",
    description: "Amazing experience working with this team! The results exceeded my expectations."
  },
  {
    id: 2,
    name: "Liam Carter",
    avatar: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=300&q=80",
    description: "Highly recommended! Great service and professional approach."
  },
  {
    id: 3,
    name: "Sophia Nguyen",
    avatar: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=300&q=80",
    description: "Exceptional quality and professionalism. Would definitely work with them again."
  }
];

export function TestimonialCarouselDemo() {
  return (
    <TestimonialCarousel
      testimonials={TESTIMONIAL_DATA}
      className="max-w-2xl mx-auto"
    />
  );
}
