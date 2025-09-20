export const getCustomerHighlight = (hp: number) => {
  const portableHighlights = [
    'Reliable & Quiet Operation',
    'Starts Every Time',
    'Perfect Kicker Motor',
    'Fuel Efficient Choice'
  ];
  
  const midRangeHighlights = [
    'Great Fuel Economy',
    'Smooth & Dependable',
    'Family Favorite',
    'Clean & Quiet'
  ];
  
  const highPowerHighlights = [
    'Power & Efficiency',
    'Quick to Plane',
    'Quiet Performance'
  ];
  
  const highlights = hp <= 10 ? portableHighlights : 
                    hp <= 50 ? midRangeHighlights : 
                    highPowerHighlights;
  
  return highlights[Math.floor(Math.random() * highlights.length)];
};

export const harrisTestimonials = [
  '"Harris treats customers like family. Been going there for 20 years." — Linda Davies, Bowmanville',
  '"Best marine service in the Kawarthas. They know their stuff." — Mike Chen, Peterborough',
  '"Harris got me the right motor and the best price." — Sarah Williams, Port Hope',
  '"Professional service, honest advice, fair pricing." — Tom Mitchell, Cobourg',
  '"They service what they sell - that matters." — Jennifer Park, Rice Lake'
];