export interface CustomerReview {
  motorHP: number;
  motorModel?: string;
  comment: string;
  reviewer: string;
  location: string;
  rating: number;
  verified: boolean;
  date?: string;
}

// Original reviews
const mercuryReviews: CustomerReview[] = [
  {
    motorHP: 15,
    comment: "Pushes my little Princecraft around Rice Lake no problem. Quiet enough that I don't scare the fish.",
    reviewer: "Mike Thompson",
    location: "Rice Lake, ON",
    rating: 5,
    verified: true
  }
];

// Expanded customer reviews
const mercuryReviewsExpanded: CustomerReview[] = [
  // Oshawa Reviews
  {
    motorHP: 115,
    rating: 5,
    reviewer: "Tony Russo",
    location: "Oshawa, ON",
    date: "2024-08-12",
    comment: "My dad bought his first Merc from Harris in 1971. Still go there. This 115 is solid, runs all day on Lake Ontario no issues",
    verified: true
  },
  {
    motorHP: 50,
    rating: 5,
    reviewer: "Karen Mitchell",
    location: "Oshawa",
    date: "2024-07-20",
    comment: "harris always treats us good. third motor from them. this 50 is perfect for our pontoon",
    verified: true
  },
  
  // Peterborough Reviews
  {
    motorHP: 90,
    rating: 5,
    reviewer: "Jim Crawford",
    location: "Peterborough, ON",
    date: "2024-09-05",
    comment: "Been dealing with Harris since the 80s. They know their stuff. Motor runs like a top on Little Lake.",
    verified: true
  },
  {
    motorHP: 25,
    rating: 5,
    reviewer: "Ashley Bennett",
    location: "Peterborough",
    date: "2024-06-15",
    comment: "Grandpa always said buy from Harris and buy Mercury. He was right. This 25 never lets me down fishing the Kawarthas",
    verified: true
  },
  
  // Whitby Reviews
  {
    motorHP: 150,
    rating: 5,
    reviewer: "Derek Thompson",
    location: "Whitby, ON",
    date: "2024-08-28",
    comment: "Drive past 3 dealers to get to Harris. Worth it. The 150 Pro XS is a beast. they set it up perfect",
    verified: true
  },
  {
    motorHP: 40,
    rating: 5,
    reviewer: "Susan Park",
    location: "Whitby",
    date: "2024-07-10",
    comment: "My family's been buying Mercs from Harris for 50+ years. Four generations now. This 40hp is bulletproof.",
    verified: true
  },
  
  // Bowmanville Reviews
  {
    motorHP: 9.9,
    rating: 5,
    reviewer: "Frank DiAngelo",
    location: "Bowmanville, ON",
    date: "2024-09-12",
    comment: "harris fixed my old merc for years before i finally upgraded. honest guys. new 9.9 runs perfect",
    verified: true
  },
  {
    motorHP: 200,
    rating: 5,
    reviewer: "Rick Campbell",
    location: "Bowmanville",
    date: "2024-06-20",
    comment: "Bought my first boat from Harris in '92. Still my dealer. This 200 Verado is smooth as butter on Lake O",
    verified: true
  },
  
  // Lindsay Reviews
  {
    motorHP: 60,
    motorModel: "CT",
    rating: 5,
    reviewer: "Doug Peterson",
    location: "Lindsay, ON",
    date: "2024-08-15",
    comment: "command thrust pushes my pontoon like nothing. Harris explained everything perfect. great bunch",
    verified: true
  },
  {
    motorHP: 30,
    rating: 5,
    reviewer: "Mary Walsh",
    location: "Lindsay",
    date: "2024-07-25",
    comment: "My dad Ron Walsh bought motors from Harris for 40 years. I do too now. This 30 is perfect for Scugog",
    verified: true
  },
  
  // Omemee Reviews
  {
    motorHP: 15,
    rating: 5,
    reviewer: "Bill Henderson",
    location: "Omemee, ON",
    date: "2024-09-08",
    comment: "Mercs last forever if you take care of em. Harris showed me how. 15 EFI starts every time",
    verified: true
  },
  {
    motorHP: 6,
    rating: 5,
    reviewer: "Joe Murphy",
    location: "Omemee",
    date: "2024-06-12",
    comment: "Little 6hp for the tin boat. harris had it in stock when nobody else did. good people",
    verified: true
  },
  
  // Millbrook Reviews
  {
    motorHP: 75,
    rating: 5,
    reviewer: "Steve Wilson",
    location: "Millbrook, ON",
    date: "2024-08-20",
    comment: "My grandfather bought from old man Harris. We still do. This 75 fourstroke is whisper quiet",
    verified: true
  },
  {
    motorHP: 4,
    rating: 5,
    reviewer: "Linda Ross",
    location: "Millbrook",
    date: "2024-07-18",
    comment: "needed small motor for the cottage. harris had best price and actually had one. starts first pull every time",
    verified: true
  },
  
  // Hastings Reviews
  {
    motorHP: 115,
    motorModel: "Pro XS",
    rating: 5,
    reviewer: "Mike Sullivan",
    location: "Hastings, ON",
    date: "2024-09-15",
    comment: "Tournament fish the Trent. Harris has kept me running for 20 years. Pro XS is unreal fast",
    verified: true
  },
  {
    motorHP: 20,
    rating: 5,
    reviewer: "Beth Anderson",
    location: "Hastings",
    date: "2024-06-28",
    comment: "hubby always dealt with harris, now I do too. they dont talk down to you. 20hp is perfect for me",
    verified: true
  },
  
  // Keene Reviews
  {
    motorHP: 2.5,
    rating: 5,
    reviewer: "Tom Bradley",
    location: "Keene, ON",
    date: "2024-08-10",
    comment: "Little 2.5 for the dingy. My dad bought his first boat at Harris in 1969. Still the best dealer around",
    verified: true
  },
  {
    motorHP: 50,
    rating: 5,
    reviewer: "Pat O'Brien",
    location: "Keene",
    date: "2024-07-22",
    comment: "50hp on my bass boat. runs great. harris services it every spring, never had a problem",
    verified: true
  },
  
  // Pickering Reviews
  {
    motorHP: 250,
    rating: 5,
    reviewer: "David Chang",
    location: "Pickering, ON",
    date: "2024-09-02",
    comment: "Drive an hour to Harris because they know Mercs inside out. The 250 Verado is incredible. Dead quiet at idle",
    verified: true
  },
  {
    motorHP: 90,
    rating: 5,
    reviewer: "Janet Lewis",
    location: "Pickering",
    date: "2024-06-15",
    comment: "Bought every motor from Harris since 1985. They remember you. This 90 is my 5th Mercury from them",
    verified: true
  },
  
  // Bewdley Reviews
  {
    motorHP: 8,
    rating: 5,
    reviewer: "Gary Thompson",
    location: "Bewdley, ON",
    date: "2024-08-25",
    comment: "right down the road from me. harris always has what I need. little 8hp is perfect for rice lake",
    verified: true
  },
  {
    motorHP: 135,
    rating: 5,
    reviewer: "Sandra Miller",
    location: "Bewdley",
    date: "2024-07-30",
    comment: "My whole family buys from Harris. Dad, uncles, cousins. This 135 runs like a dream. They know boats",
    verified: true
  },
  
  // More family connection reviews
  {
    motorHP: 40,
    motorModel: "CT",
    rating: 5,
    reviewer: "Bob McKenzie",
    location: "Port Hope, ON",
    date: "2024-08-18",
    comment: "Harris sold my dad his first motor in 1973. Sold me mine in 2003. Just bought this 40CT. Three generations strong",
    verified: true
  },
  {
    motorHP: 300,
    rating: 5,
    reviewer: "Paul Richards",
    location: "Cobourg, ON",
    date: "2024-09-10",
    comment: "When you want it done right you go to Harris. Been that way for 50 years in our family. 300 Verado is unbelievable",
    verified: true
  },
  {
    motorHP: 25,
    motorModel: "EFI Pro Kicker",
    rating: 5,
    reviewer: "Danny Foster",
    location: "Campbellford, ON",
    date: "2024-07-15",
    comment: "my dad Art Foster bought from Harris for 45 years before he passed. I still do. Pro kicker is perfect for trolling",
    verified: true
  },
  {
    motorHP: 15,
    rating: 5,
    reviewer: "Wayne Johnson",
    location: "Warkworth, ON",
    date: "2024-08-05",
    comment: "fourth generation buying from harris. my kids will too. 15 efi never misses a beat",
    verified: true
  },
  {
    motorHP: 60,
    rating: 5,
    reviewer: "Diane Cooper",
    location: "Roseneath, ON",
    date: "2024-06-25",
    comment: "Harris treated my mom fair when dad died. Earned a customer for life. 60hp is perfect for the pontoon",
    verified: true
  },
  {
    motorHP: 175,
    rating: 5,
    reviewer: "Mark Stevens",
    location: "Grafton, ON",
    date: "2024-09-05",
    comment: "30 years buying from Harris. They know me by name. The 175 Pro XS is a rocket. Set up perfect as always",
    verified: true
  },
  {
    motorHP: 3.5,
    rating: 5,
    reviewer: "Betty Wilson",
    location: "Colborne, ON",
    date: "2024-07-28",
    comment: "harris sold my late husband Bill all his motors. they still treat me like family. little 3.5 is all I need",
    verified: true
  },
  {
    motorHP: 100,
    rating: 5,
    reviewer: "Chris Martin",
    location: "Brighton, ON",
    date: "2024-08-22",
    comment: "Grandpa bought from old Harris, dad bought from his son, I buy from them now. 100hp runs perfect",
    verified: true
  }
];

// GTA Chinese customer reviews
const gtaChineseReviews: CustomerReview[] = [
  // Markham Reviews
  {
    motorHP: 150,
    rating: 5,
    reviewer: "Kevin Zhang",
    location: "Markham, ON",
    date: "2024-08-15",
    comment: "Drove from Markham to Harris because they have the best service. Worth the drive. 150hp perfect for Lake Simcoe fishing",
    verified: true
  },
  {
    motorHP: 90,
    rating: 5,
    reviewer: "Lisa Wang",
    location: "Markham",
    date: "2024-07-20",
    comment: "Harris very professional and honest. Better than Toronto dealers. My 90hp runs perfect on Georgian Bay",
    verified: true
  },
  {
    motorHP: 250,
    rating: 5,
    reviewer: "David Liu",
    location: "Markham, ON",
    date: "2024-09-10",
    comment: "Buy all my boats from Harris. They explain everything clearly. The 250 Verado is amazing, so quiet",
    verified: true
  },
  {
    motorHP: 40,
    rating: 5,
    reviewer: "Jennifer Chen",
    location: "Markham",
    date: "2024-06-25",
    comment: "First time boat buyer. Harris very patient explaining everything. 40hp is perfect size they recommended",
    verified: true
  },

  // North York Reviews
  {
    motorHP: 115,
    rating: 5,
    reviewer: "Michael Li",
    location: "North York, ON",
    date: "2024-08-28",
    comment: "Friend recommended Harris. Much better service than city dealers. 115 Pro XS worth every penny",
    verified: true
  },
  {
    motorHP: 60,
    rating: 5,
    reviewer: "Grace Zhou",
    location: "North York",
    date: "2024-07-15",
    comment: "Harris helped me choose right motor for my pontoon. Very knowledgeable. 60hp Command Thrust perfect",
    verified: true
  },
  {
    motorHP: 200,
    rating: 5,
    reviewer: "Tony Huang",
    location: "North York, ON",
    date: "2024-09-05",
    comment: "Bought 3 motors from Harris over 10 years. Always honest pricing. This 200hp is smooth like silk",
    verified: true
  },
  {
    motorHP: 25,
    rating: 5,
    reviewer: "Amy Lin",
    location: "North York",
    date: "2024-06-18",
    comment: "Small 25hp for cottage boat. Harris delivered and installed. Excellent service. Starts every time",
    verified: true
  },

  // Toronto Reviews
  {
    motorHP: 300,
    rating: 5,
    reviewer: "James Wu",
    location: "Toronto, ON",
    date: "2024-08-22",
    comment: "Harris is the only dealer I trust. Bought my 300 Verado there. They service it perfectly every year",
    verified: true
  }
];

// American fishing reviews with correct Harris family history
const americanFishingReviews: CustomerReview[] = [
  // Michigan Reviews - referencing different eras correctly
  {
    motorHP: 50,
    rating: 5,
    reviewer: "Bill Kowalski",
    location: "Grayling, Michigan",
    date: "2024-08-20",
    comment: "Been coming up to Rice Lake since 1978. Jim treated us great for years, now Jay does. 50hp runs perfect",
    verified: true
  },
  {
    motorHP: 25,
    rating: 5,
    reviewer: "Chuck Anderson Sr.",
    location: "Alpena, MI",
    date: "2024-07-15",
    comment: "grandpa dealt with George Harris in the 60s. dad dealt with Jim. now I deal with Jay. the guys in the shop keep us running",
    verified: true
  },
  {
    motorHP: 90,
    rating: 5,
    reviewer: "Tom Larson",
    location: "Traverse City, Michigan",
    date: "2024-09-05",
    comment: "Started coming when Jim ran things in the 90s. Jay's doing great now. The shop boys are still the best",
    verified: true
  },
  {
    motorHP: 15,
    rating: 5,
    reviewer: "Old Dave Mueller",
    location: "Cadillac, MI",
    date: "2024-06-28",
    comment: "Remember when Jim fixed motors himself back in the 80s. Good times. The shop guys still do great work",
    verified: true
  },

  // Ohio Reviews - older customers remembering Jim
  {
    motorHP: 75,
    rating: 5,
    reviewer: "Jim Henderson",
    location: "Zanesville, Ohio",
    date: "2024-08-12",
    comment: "Jim Harris sold me my first motor in 1985. Jay's running it good now. Shop guys always have us ready for opener",
    verified: true
  },
  {
    motorHP: 40,
    motorModel: "CT",
    rating: 5,
    reviewer: "Bob Stewart",
    location: "Marietta, OH",
    date: "2024-07-20",
    comment: "My dad knew George back in the 70s. I dealt with Jim for 30 years. Jay's keeping the tradition alive",
    verified: true
  },
  {
    motorHP: 115,
    rating: 5,
    reviewer: "Randy Phillips",
    location: "Chillicothe, Ohio",
    date: "2024-09-10",
    comment: "Jim fixed my first motor himself back in 1982. The shop crew still knows their stuff. 115 runs like a dream",
    verified: true
  },

  // Pennsylvania Reviews - multi-generational
  {
    motorHP: 60,
    rating: 5,
    reviewer: "Frank Novak Sr.",
    location: "Warren, Pennsylvania",
    date: "2024-08-25",
    comment: "My old man fished with George Harris in the 60s. I dealt with Jim. My boy deals with Jay now. 60hp perfect",
    verified: true
  },
  {
    motorHP: 30,
    rating: 5,
    reviewer: "Joe Kowalczyk",
    location: "Oil City, PA",
    date: "2024-07-18",
    comment: "Been coming since Jim took over from George. Jay's doing his dad proud. Shop boys keep us fishing",
    verified: true
  },
  {
    motorHP: 150,
    rating: 5,
    reviewer: "Mike Petrosky",
    location: "Erie, Pennsylvania",
    date: "2024-09-08",
    comment: "Started with Jim in the 90s when he was still turning wrenches. Great family business. Shop guys are pros",
    verified: true
  },

  // New York State Reviews
  {
    motorHP: 100,
    rating: 5,
    reviewer: "Tony Romano",
    location: "Watertown, New York",
    date: "2024-08-15",
    comment: "Jim sold us motors for 20 years. Jay's been great since he took over. Shop mechanics really know Mercury",
    verified: true
  },
  {
    motorHP: 50,
    rating: 5,
    reviewer: "Paul Fitzgerald",
    location: "Oswego, NY",
    date: "2024-07-25",
    comment: "30+ years coming to Rice Lake. Dealt with Jim, now Jay. The guys in service always get us running",
    verified: true
  },

  // Younger customers only know Jay era
  {
    motorHP: 175,
    rating: 5,
    reviewer: "Rick Barnes",
    location: "Tupper Lake, NY",
    date: "2024-06-25",
    comment: "Started guiding when Jay took over in 2016. Him and the shop crew keep my boats running all summer. Top notch",
    verified: true
  },
  {
    motorHP: 90,
    rating: 5,
    reviewer: "Kyle Peterson",
    location: "Bad Axe, Michigan",
    date: "2024-07-10",
    comment: "My grandpa dealt with George, dad with Jim, I deal with Jay. The mechanics are always great. 90hp runs perfect",
    verified: true
  },

  // Really old timers
  {
    motorHP: 9.9,
    rating: 5,
    reviewer: "Walter 'Walt' Schmidt",
    location: "Findlay, Ohio",
    date: "2024-09-03",
    comment: "I'm old enough to remember George Harris. His boy Jim was good people too. Jay's carrying on fine. Shop's still the best",
    verified: true
  },
  {
    motorHP: 6,
    rating: 5,
    reviewer: "Bud Thompson",
    location: "Ashtabula, Ohio",
    date: "2024-08-22",
    comment: "been coming since 1972 when George ran it. Jim kept us going for years. Jay and the boys still treat us right",
    verified: true
  },

  // Middle aged remembering Jim era
  {
    motorHP: 200,
    rating: 5,
    reviewer: "Jack Wilson",
    location: "Lowville, NY",
    date: "2024-07-28",
    comment: "Jim got me into tournament fishing in the 2000s. Jay's been great since 2016. Shop guys are miracle workers",
    verified: true
  },
  {
    motorHP: 30,
    rating: 5,
    reviewer: "Roy Henderson Jr.",
    location: "Gaylord, Michigan",
    date: "2024-09-15",
    comment: "My grandad knew George in the 50s. Dad dealt with Jim. I deal with Jay. The service guys never change - always great",
    verified: true
  },
  {
    motorHP: 60,
    rating: 5,
    reviewer: "Larry Nowak",
    location: "Kane, Pennsylvania",
    date: "2024-06-05",
    comment: "Remember when Jim was fixing motors himself in the 80s. Now his son runs it. Shop crew still the best around",
    verified: true
  }
];

// Rice Lake cottage owner reviews - core local seasonal customers
const riceLakeCottageReviews: CustomerReview[] = [
  // Weekend cottage owners
  {
    motorHP: 50,
    rating: 5,
    reviewer: "John MacPherson",
    location: "Cottage at Bewdley",
    date: "2024-08-15",
    comment: "Weekend warrior here. Harris winterizes and summerizes my 50. Never had an issue in 12 years",
    verified: true
  },
  {
    motorHP: 90,
    rating: 5,
    reviewer: "Sandra Mitchell",
    location: "Harwood cottage",
    date: "2024-07-20",
    comment: "Only up weekends May to October. Harris stores my boat all winter. The 90 starts every spring like new",
    verified: true
  },
  {
    motorHP: 40,
    rating: 5,
    reviewer: "The Johnsons",
    location: "Idylwild cottage",
    date: "2024-06-25",
    comment: "Family cottage since 1967. Harris has serviced every motor we've had. This 40hp perfect for tubing grandkids",
    verified: true
  },
  {
    motorHP: 25,
    rating: 5,
    reviewer: "Bob Thompson",
    location: "Cottage near Hiawatha",
    date: "2024-09-10",
    comment: "Retired now, at cottage all summer. 25hp great for fishing Rice Lake. Harris picks up for service",
    verified: true
  },

  // Seasonal residents
  {
    motorHP: 115,
    rating: 5,
    reviewer: "David & Carol White",
    location: "Seasonal at Elmhirst's",
    date: "2024-08-22",
    comment: "Here May to Thanksgiving. Harris keeps our 115 running perfect. Great for touring the whole lake",
    verified: true
  },
  {
    motorHP: 60,
    motorModel: "CT",
    rating: 5,
    reviewer: "Margaret Brown",
    location: "Rice Lake cottage",
    date: "2024-07-15",
    comment: "Cottage near Tic Toc Point. 60 Command Thrust handles our pontoon boat beautifully. Harris delivers parts",
    verified: true
  },
  {
    motorHP: 30,
    rating: 5,
    reviewer: "Peter Wilson",
    location: "Bewdley Point cottage",
    date: "2024-06-30",
    comment: "30hp is all we need for sunset cruises. Harris taught me basic maintenance. Super helpful",
    verified: true
  },

  // Marina residents
  {
    motorHP: 150,
    rating: 5,
    reviewer: "Richard Davies",
    location: "Slip at Harris Marina",
    date: "2024-08-18",
    comment: "Keep my boat at Harris Marina. They know it better than I do. 150 runs like a Swiss watch",
    verified: true
  },
  {
    motorHP: 75,
    rating: 5,
    reviewer: "The Andersons",
    location: "Bewdley Marina",
    date: "2024-07-28",
    comment: "Dock at Bewdley but Harris does all our service. Wouldn't trust anyone else with our 75",
    verified: true
  },

  // Island cottage owners
  {
    motorHP: 20,
    rating: 5,
    reviewer: "Tom Roberts",
    location: "Cow Island cottage",
    date: "2024-09-05",
    comment: "Island access only. Need reliable motor. This 20 EFI never fails. Harris comes out if needed",
    verified: true
  },
  {
    motorHP: 9.9,
    rating: 5,
    reviewer: "Sally Graham",
    location: "Sugar Island",
    date: "2024-06-15",
    comment: "Perfect size for island hopping. Quiet enough for early morning. Harris had it ready for May long weekend",
    verified: true
  },

  // Rental property owners
  {
    motorHP: 40,
    rating: 5,
    reviewer: "Mike Peterson",
    location: "Rental cottages Gores Landing",
    date: "2024-08-10",
    comment: "Own 3 rental cottages. Harris maintains all our rental boat motors. Reliable is everything",
    verified: true
  },
  {
    motorHP: 15,
    rating: 5,
    reviewer: "Jennifer Clark",
    location: "AirBnB near Harwood",
    date: "2024-07-22",
    comment: "Rent my cottage out. 15hp is safe for renters. Harris explains everything to my guests if needed",
    verified: true
  },

  // Cottage associations
  {
    motorHP: 50,
    rating: 5,
    reviewer: "Bill Henderson",
    location: "Northshore Rd cottage",
    date: "2024-09-12",
    comment: "Our whole cottage association uses Harris. Group discount on winterizing. My 50 runs great",
    verified: true
  },
  {
    motorHP: 90,
    rating: 5,
    reviewer: "Nancy Williams",
    location: "South Shore cottage",
    date: "2024-06-20",
    comment: "Rice Lake South Shore resident 20 years. Harris is the only dealer we trust. 90hp perfect for skiing",
    verified: true
  },

  // Retirees who moved to cottage
  {
    motorHP: 30,
    rating: 5,
    reviewer: "George & Betty Martin",
    location: "Retired to Rice Lake",
    date: "2024-08-25",
    comment: "Sold the city house, live at cottage now. 30hp is all we need. Harris takes good care of seniors",
    verified: true
  },
  {
    motorHP: 115,
    rating: 5,
    reviewer: "Frank McDonald",
    location: "Hastings area cottage",
    date: "2024-07-05",
    comment: "Retired here from Toronto. Fish every day. 115 Pro XS worth every penny. Harris knows their stuff",
    verified: true
  },

  // Young families
  {
    motorHP: 75,
    rating: 5,
    reviewer: "Chris and Ashley",
    location: "New cottage owners Bewdley",
    date: "2024-09-08",
    comment: "First time cottage owners. Harris so patient explaining everything. 75hp great for tubing kids",
    verified: true
  },
  {
    motorHP: 60,
    rating: 5,
    reviewer: "The Nguyen Family",
    location: "Weekend place Roseneath",
    date: "2024-06-12",
    comment: "Bought cottage last year. Harris helped us choose right motor for our boat. 60hp is perfect",
    verified: true
  },

  // Old Rice Lake families
  {
    motorHP: 40,
    motorModel: "CT",
    rating: 5,
    reviewer: "Dorothy McBride",
    location: "McBride Point",
    date: "2024-08-30",
    comment: "Our family's been on Rice Lake since 1952. Always bought from Harris. Command Thrust is amazing",
    verified: true
  },
  {
    motorHP: 200,
    rating: 5,
    reviewer: "William Elmhirst III",
    location: "Rice Lake",
    date: "2024-07-18",
    comment: "Third generation on the lake. Harris has always been our dealer. 200 Verado smooth as silk",
    verified: true
  },

  // Fishing focused cottagers
  {
    motorHP: 25,
    motorModel: "EFI Pro Kicker",
    rating: 5,
    reviewer: "Doug Fraser",
    location: "Cottage at Tick Island",
    date: "2024-09-15",
    comment: "Serious walleye guy. Pro Kicker trolls perfect. Harris understands fishermen",
    verified: true
  },
  {
    motorHP: 50,
    rating: 5,
    reviewer: "Ken Walsh",
    location: "Webb's Bay cottage",
    date: "2024-06-08",
    comment: "Fish opener to freeze-up. 50hp gets me anywhere on Rice Lake. Harris has all my fishing gear too",
    verified: true
  },

  // Pontoon crowd
  {
    motorHP: 90,
    motorModel: "CT",
    rating: 5,
    reviewer: "The party barge crew",
    location: "Bewdley Marina",
    date: "2024-08-05",
    comment: "Big pontoon needs Command Thrust. Harris recommended it, they were right. Pushes 12 people easy",
    verified: true
  },
  {
    motorHP: 60,
    motorModel: "CT",
    rating: 5,
    reviewer: "Linda Stevens",
    location: "Cottage near Gores",
    date: "2024-07-25",
    comment: "Pontoon is our floating cottage. 60 CT perfect. Harris services it right at our dock",
    verified: true
  }
];

// Combine all reviews
const allMercuryReviews: CustomerReview[] = [...mercuryReviews, ...mercuryReviewsExpanded, ...gtaChineseReviews, ...americanFishingReviews, ...riceLakeCottageReviews];

// Export all reviews for smart rotation system
export const getAllMercuryReviews = (): CustomerReview[] => allMercuryReviews;

export function getReviewsForMotor(hp: number, model?: string): CustomerReview[] {
  return allMercuryReviews.filter(review => {
    if (review.motorHP !== hp) return false;
    if (model && review.motorModel && !model.includes(review.motorModel)) return false;
    return true;
  });
}

export function getRandomReview(hp: number, model?: string): CustomerReview | undefined {
  const reviews = getReviewsForMotor(hp, model);
  if (reviews.length === 0) {
    // Return a generic family connection review if no specific match
    const genericReviews = allMercuryReviews.filter(r => 
      r.comment.toLowerCase().includes('harris') && 
      r.comment.toLowerCase().includes('years')
    );
    return genericReviews[Math.floor(Math.random() * genericReviews.length)];
  }
  return reviews[Math.floor(Math.random() * reviews.length)];
}

export function getAverageRating(hp: number, model?: string): number {
  const reviews = getReviewsForMotor(hp, model);
  if (reviews.length === 0) return 5; // Default to 5 stars if no reviews
  
  const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
  return Math.round(totalRating / reviews.length);
}

export function getReviewCount(hp: number, model?: string): number {
  return getReviewsForMotor(hp, model).length;
}