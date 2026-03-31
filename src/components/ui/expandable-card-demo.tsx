"use client";

import { ExpandableCard } from "@/components/ui/expandable-card";

export default function ExpandableCardDemo() {
  return (
    <div className="flex justify-center">
      <ExpandableCard
        title="Digital Revolution"
        src="https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&h=600&fit=crop&q=80"
        description="The Future of Technology"
        classNameExpanded="[&_h4]:text-black dark:[&_h4]:text-white [&_h4]:font-medium"
      >
        <h4>The Rise of Artificial Intelligence</h4>
        <p>
          In the heart of Silicon Valley, a revolution is quietly unfolding.
          Artificial Intelligence, once the stuff of science fiction, has become
          the driving force behind the most transformative technologies of our
          time.
        </p>
        <h4>The Quantum Computing Breakthrough</h4>
        <p>
          Scientists are racing to harness quantum mechanics. Quantum computers
          promise to solve problems that would take classical computers
          millennia to crack.
        </p>
        <h4>The Internet of Everything</h4>
        <p>
          Smart cities are emerging, where traffic lights communicate with cars,
          and systems optimize in real time to make life more efficient and
          sustainable.
        </p>
        <h4>The Future of Human-Machine Collaboration</h4>
        <p>
          The future belongs to those who harness human creativity and machine
          precision, working together to solve the greatest challenges.
        </p>
      </ExpandableCard>
    </div>
  );
}
