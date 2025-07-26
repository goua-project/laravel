import React from 'react';
import Hero from '../components/landing/Hero';
import HowItWorks from '../components/landing/HowItWorks';
import FeaturedStores from '../components/landing/FeaturedStores';

const LandingPage: React.FC = () => {
  return (
    <div>
      <Hero />
      <HowItWorks />
      <FeaturedStores />
    </div>
  );
};

export default LandingPage;