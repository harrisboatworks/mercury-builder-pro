// Diverse testimonials representing GTA's multicultural boating community
export interface Testimonial {
  quote: string;
  name: string;
  location: string;
  rating?: number;
  dateLabel?: string;
}

export const allTestimonials: Testimonial[] = [
  // Long-term loyalty themes
  { quote: "My dad bought his first Merc from Harris in 1971. Still go there.", name: "Tony Russo", location: "Oshawa" },
  { quote: "I drive past three dealers to get to Harris. Worth every mile.", name: "Jim Crawford", location: "Peterborough" },
  { quote: "Been a customer for 15 years. Wouldn't go anywhere else.", name: "Tom Bradley", location: "Orillia" },
  { quote: "Third generation buying from Harris. Reliable and honest service.", name: "Rob Peterson", location: "Cobourg" },
  { quote: "Harris treats customers like family. Been going there for 20 years.", name: "Linda Davies", location: "Bowmanville" },
  { quote: "My whole family buys from Harris. Trusted for generations.", name: "Peter Schmidt", location: "Oakville" },
  
  // Service quality themes
  { quote: "Superb experience! First boat, first motor — couldn't be happier.", name: "Derek Thompson", location: "Whitby" },
  { quote: "Honest guys, fair prices, and they stand behind their work.", name: "Mike Johnson", location: "Port Hope" },
  { quote: "Best motor shop in Ontario. Period.", name: "Steve Williams", location: "Belleville" },
  { quote: "No pressure sales. Just honest advice and fair pricing.", name: "Chris Martin", location: "Clarington" },
  { quote: "Family-owned feel with professional expertise.", name: "John MacLeod", location: "Port Perry" },
  { quote: "Clean shop, professional staff, quality work.", name: "Andy Pham", location: "Ajax" },
  { quote: "Honest mechanics. Hard to find these days.", name: "Jennifer Wilson", location: "Huntsville" },
  
  // Water-testing experiences
  { quote: "They water-tested my motor right on Rice Lake. Ran perfectly.", name: "Paul Anderson", location: "Newcastle" },
  { quote: "Love that they test every motor on the water, not just a bench.", name: "Dave O'Brien", location: "Kawartha Lakes" },
  { quote: "Watched them tune my motor on the lake. That's real service.", name: "Rick Sullivan", location: "Barrie" },
  { quote: "The water test showed me exactly how she'd perform. No surprises.", name: "Frank Kowalski", location: "Hamilton" },
  { quote: "They took my boat out and dialed in the prop. Runs like a dream.", name: "Mark Stevens", location: "Innisfil" },
  
  // Warranty support themes
  { quote: "Had a warranty issue — resolved same week, no hassle.", name: "Brian Murphy", location: "Lindsay" },
  { quote: "The warranty support is excellent. No questions asked.", name: "Maria Garcia", location: "Burlington" },
  { quote: "Mercury warranty claim was handled quickly. Harris made it easy.", name: "Kevin Walsh", location: "Haliburton" },
  { quote: "Warranty work done right the first time. Very impressed.", name: "Susan Campbell", location: "Milton" },
  { quote: "Had an issue 2 years in. They fixed it under warranty, no fuss.", name: "Dan Fraser", location: "Midland" },
  
  // Financing ease themes
  { quote: "The financing made upgrading my motor affordable.", name: "Lisa Taylor", location: "Muskoka" },
  { quote: "Great financing options. Got into a bigger motor than I expected.", name: "James Kim", location: "North York" },
  { quote: "Easy monthly payments. Made the purchase stress-free.", name: "Tommy Nguyen", location: "Etobicoke" },
  { quote: "Financing approval was quick. On the water in days.", name: "Angela Cruz", location: "Pickering" },
  { quote: "Flexible financing helped us get the motor we really wanted.", name: "Priya Sharma", location: "Mississauga" },
  { quote: "Low monthly payments made a new Merc possible for us.", name: "Grace Yoon", location: "Vaughan" },
  
  // Repower/installation expertise
  { quote: "Factory-certified repowers done right. No shortcuts.", name: "Sarah Mitchell", location: "Gravenhurst" },
  { quote: "The repower on my Lund was flawless. Runs better than new.", name: "David Chen", location: "Richmond Hill" },
  { quote: "Professional installation and great customer care.", name: "Michelle Wong", location: "Markham" },
  { quote: "Harris went above and beyond for my repower.", name: "Marco Santos", location: "Ajax" },
  { quote: "The guys really know Mercury inside and out.", name: "Daniel Lee", location: "Thornhill" },
  
  // Quick turnaround themes
  { quote: "Quick turnaround and excellent communication.", name: "Jennifer Lee", location: "North York" },
  { quote: "They went above and beyond to get my boat ready for the long weekend.", name: "Arjun Singh", location: "Markham" },
  { quote: "Needed a fast turnaround before opener — they delivered.", name: "Ryan Garcia", location: "Scarborough" },
  { quote: "Service was done in 2 days. Couldn't believe it.", name: "Emily Le", location: "Mississauga" },
  
  // Parts and advice themes
  { quote: "They took time to find the right motor for my fishing boat.", name: "Raj Patel", location: "Brampton" },
  { quote: "Harris took time to explain everything. No pressure, just good advice.", name: "Vikram Mehta", location: "Brampton" },
  { quote: "They helped me find the perfect motor for Rice Lake trips.", name: "Kevin Liu", location: "Scarborough" },
  { quote: "They diagnosed my old motor and saved me thousands.", name: "Michael Zhang", location: "Richmond Hill" },
  { quote: "Got the right prop recommendation. Huge difference in performance.", name: "Lisa Tran", location: "Mississauga" },
  
  // Follow-up and communication themes
  { quote: "Great follow-up after the sale. They actually care.", name: "Sarah Park", location: "Vaughan" },
  { quote: "Harris made the whole process easy. Highly recommend.", name: "Anita Desai", location: "Scarborough" },
  { quote: "Excellent communication throughout the whole process.", name: "Maria Reyes", location: "Pickering" },
  { quote: "Smooth transaction from quote to water. Very impressed.", name: "Peter O'Neill", location: "Cobourg" },
  { quote: "They called to check in after installation. Classy move.", name: "Nancy Chen", location: "Markham" },
  
  // Trade-in experiences
  { quote: "Fair trade-in value on my old motor. No games.", name: "Robert Kim", location: "Thornhill" },
  { quote: "Trade-in process was simple. Got a great deal on the upgrade.", name: "John Patel", location: "Brampton" },
  { quote: "They gave me top dollar for my old Merc.", name: "Bill Thompson", location: "Whitby" },
  
  // Value/pricing themes
  { quote: "Best prices on Mercury in the GTA. Checked everywhere.", name: "Andrew Wong", location: "Richmond Hill" },
  { quote: "Better price than the big box stores, way better service.", name: "Mike Nguyen", location: "Mississauga" },
  { quote: "Fair pricing, no hidden fees. Refreshing.", name: "Chris Santos", location: "Ajax" },
  { quote: "Quick, professional, and fairly priced. What more could you ask?", name: "Dave Park", location: "North York" },
  
  // Emergency/seasonal themes
  { quote: "Fixed my motor the day before our fishing trip. Lifesavers.", name: "Tony Lee", location: "Scarborough" },
  { quote: "Spring service was done quick so I didn't miss opener.", name: "Jim Walsh", location: "Peterborough" },
  { quote: "Called with an emergency before a tournament. They came through.", name: "Sam Russo", location: "Oshawa" },
  { quote: "Winterization done right. Started first pull in spring.", name: "Karen Singh", location: "Brampton" },
];

