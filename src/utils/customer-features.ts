export const getCustomerHighlight = (hp: number) => {
  const portableHighlights = [
    'Customers love: "Starts first pull every time, even after winter storage"',
    'Top feedback: "Light enough to carry but powerful enough to move my boat"',
    'Why they buy: "Dead quiet at trolling speed - doesn\'t spook fish"',
    'Common praise: "Most reliable kicker motor I\'ve owned"'
  ];
  
  const midRangeHighlights = [
    'Customer favorite: "Uses half the fuel of my old 2-stroke"',
    'Often heard: "Perfect power for family watersports"',
    'Why they upgrade: "Smooth, smoke-free, and surprisingly quiet"',
    'Top reason: "Mercury reliability with modern fuel efficiency"'
  ];
  
  const highPowerHighlights = [
    'Performance feedback: "Jumps on plane with a full load of gear"',
    'Why they choose it: "Power and fuel economy in perfect balance"',
    'Customer comment: "Quietest motor in this HP range by far"'
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