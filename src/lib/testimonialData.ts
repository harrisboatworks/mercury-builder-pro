// Diverse testimonials representing GTA's multicultural boating community
export interface Testimonial {
  quote: string;
  name: string;
  location: string;
  rating?: number;
  dateLabel?: string;
}

export const allTestimonials: Testimonial[] = [
  // Traditional Canadian/European names
  { quote: "My dad bought his first Merc from Harris in 1971. Still go there.", name: "Tony Russo", location: "Oshawa" },
  { quote: "Superb experience! First boat, first motor — couldn't be happier.", name: "Derek Thompson", location: "Whitby" },
  { quote: "I drive past three dealers to get to Harris. Worth every mile.", name: "Jim Crawford", location: "Peterborough" },
  { quote: "Honest guys, fair prices, and they stand behind their work.", name: "Rob Peterson", location: "Cobourg" },
  { quote: "Factory-certified repowers done right. No shortcuts.", name: "Linda Davies", location: "Bowmanville" },
  { quote: "Best motor shop in Ontario. Period.", name: "Mike Johnson", location: "Port Hope" },
  { quote: "They took time to find the right motor for my fishing boat.", name: "Steve Williams", location: "Belleville" },
  { quote: "Third motor from Harris. Service keeps me coming back.", name: "Paul Anderson", location: "Newcastle" },
  { quote: "No pressure sales. Just honest advice and fair pricing.", name: "Chris Martin", location: "Clarington" },
  { quote: "The repower on my Lund was flawless. Runs better than new.", name: "Dave O'Brien", location: "Kawartha Lakes" },
  { quote: "Family-owned feel with professional expertise.", name: "John MacLeod", location: "Port Perry" },
  { quote: "Harris made the whole process easy. Highly recommend.", name: "Brian Murphy", location: "Lindsay" },
  { quote: "Great follow-up after the sale. They actually care.", name: "Kevin Walsh", location: "Haliburton" },
  { quote: "Been a customer for 15 years. Wouldn't go anywhere else.", name: "Tom Bradley", location: "Orillia" },
  { quote: "The guys really know Mercury inside and out.", name: "Rick Sullivan", location: "Barrie" },
  { quote: "Quick turnaround and excellent communication.", name: "Mark Stevens", location: "Innisfil" },
  { quote: "They went above and beyond to get my boat ready for the long weekend.", name: "Dan Fraser", location: "Midland" },
  { quote: "Professional installation and great customer care.", name: "Sarah Mitchell", location: "Gravenhurst" },
  { quote: "Honest mechanics. Hard to find these days.", name: "Jennifer Wilson", location: "Huntsville" },
  { quote: "The financing made upgrading my motor affordable.", name: "Lisa Taylor", location: "Muskoka" },
  
  // South Asian names (~12%)
  { quote: "Harris took time to explain everything. No pressure, just good advice.", name: "Raj Patel", location: "Brampton" },
  { quote: "Best service I've experienced. The team really knows their motors.", name: "Priya Sharma", location: "Mississauga" },
  { quote: "Honest pricing and great follow-up. Highly recommend.", name: "Arjun Singh", location: "Markham" },
  { quote: "Made my first boat purchase stress-free. Excellent team.", name: "Anita Desai", location: "Scarborough" },
  { quote: "Worth the drive from Brampton. Professional and knowledgeable.", name: "Vikram Mehta", location: "Brampton" },
  
  // Chinese names (~10%)
  { quote: "Third boat, third motor from Harris. Never disappointed.", name: "David Chen", location: "Richmond Hill" },
  { quote: "Professional installation and excellent customer care.", name: "Michelle Wong", location: "Markham" },
  { quote: "They helped me find the perfect motor for Rice Lake trips.", name: "Kevin Liu", location: "Scarborough" },
  { quote: "Great experience from start to finish. Will be back.", name: "Jennifer Lee", location: "North York" },
  
  // Korean names (~8%)
  { quote: "The financing options made getting a new motor easy.", name: "James Kim", location: "North York" },
  { quote: "Great experience from quote to installation.", name: "Sarah Park", location: "Vaughan" },
  { quote: "Knowledgeable staff and fair prices. Recommended.", name: "Daniel Lee", location: "Thornhill" },
  
  // Vietnamese names (~5%)
  { quote: "Harris went above and beyond for my repower.", name: "Tommy Nguyen", location: "Etobicoke" },
  { quote: "Friendly staff and fair prices. Will return.", name: "Lisa Tran", location: "Mississauga" },
  
  // Filipino names (~5%)
  { quote: "Excellent service and follow-up. Like family.", name: "Marco Santos", location: "Ajax" },
  { quote: "They made buying a motor stress-free.", name: "Angela Cruz", location: "Pickering" },
  
  // Additional diverse entries
  { quote: "My whole family buys from Harris. Trusted for generations.", name: "Peter Schmidt", location: "Oakville" },
  { quote: "The warranty support is excellent. No questions asked.", name: "Maria Garcia", location: "Burlington" },
  { quote: "Clean shop, professional staff, quality work.", name: "Andy Pham", location: "Ajax" },
  { quote: "Best prices on Mercury in the GTA. Checked everywhere.", name: "Michael Zhang", location: "Richmond Hill" },
  { quote: "They diagnosed my old motor and saved me thousands.", name: "Grace Yoon", location: "Vaughan" },
  { quote: "Smooth transaction from quote to water. Very impressed.", name: "Ryan Garcia", location: "Scarborough" },
  { quote: "The team treats you like family. Rare these days.", name: "Emily Le", location: "Mississauga" },
  { quote: "Quick, professional, and fairly priced. What more could you ask?", name: "Maria Reyes", location: "Pickering" },
  { quote: "Harris has been servicing my boats for over a decade.", name: "Frank Kowalski", location: "Hamilton" },
  { quote: "Excellent communication throughout the whole process.", name: "Susan Campbell", location: "Milton" },
];
