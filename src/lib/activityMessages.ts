// src/lib/activityMessages.ts
// A pool of Canadian-flavoured activity templates and data for realistic ticker messages

export const firstNames = [
  "Mike","Sarah","Jordan","Taylor","Chris","Morgan","Alex","Jamie","Pat","Cameron",
  "Jess","Dan","Sam","Erin","Brett","Shawn","Colin","Kyle","Megan","Brianna",
  "Avery","Dylan","Katie","Nicole","Liam","Noah","Olivia","Emma","Charlotte","Amelia",
  "Ethan","Lucas","Jack","Henry","Sophie","Chloe","Aiden","Isla","Mason","Leo"
] as const;

export const ontarioCities = [
  "Peterborough","Oshawa","Barrie","Kingston","Cobourg","Orillia","Belleville","Lindsay",
  "Bowmanville","Port Hope","North Bay","Sudbury","Ottawa","Toronto","Guelph","Kitchener",
  "Waterloo","London","Hamilton","Burlington","Oakville","Mississauga","Brampton","Whitby",
  "Ajax","Pickering","St. Catharines","Niagara Falls","Sarnia","Windsor","Cobourg","Trenton",
  "Port Perry","Port Carling","Gravenhurst","Bracebridge","Fenelon Falls","Bobcaygeon"
] as const;

export const motorModels = [
  "9.9HP ProKicker","15HP EFI","20HP EFI","25HP","30HP EFI","40HP","50HP","60HP Command Thrust",
  "75HP","90HP","115HP","150HP","200HP V6","225HP V6","250HP V8","300HP V8"
] as const;

export const timePhrases = [
  "just now","10 minutes ago","20 minutes ago","35 minutes ago","about an hour ago",
  "2 hours ago","earlier today","this morning","yesterday"
] as const;

// Sentence templates. Use {name}, {city}, {lake}, {model}, {count}, {time}
export const templates = [
  "{name} from {city} just reserved a {model}",
  "{name} from {city} is viewing this motor",
  "{count} people got quotes in the last hour",
  "Spring installation spots: {count} remaining",
  "Last {model} sold {time}",
  "Financing pre-approvals today: {count}",
  "{name} from {city} compared {count} motors",
  "{name} asked about install on {lake}",
  "Trade-in valuations today: {count}",
  "{name} saved this motor to favourites",
  "{count} people are viewing Mercury {model} right now",
  "{name} from {city} started a quote",
  "{name} unlocked seasonal pricing on a {model}",
  "{count} shoppers from the Kawarthas browsing right now",
  "{name} booked a repower consult",
  "Popular on {lake} today: {model}",
  "{count} people checked installation options",
  "{name} from {city} asked about tiller vs remote",
  "{count} models added to compare today",
  "Most viewed size right now: {model}",
  "{name} from {city} applied a financing filter",
  "{count} quotes sent to inbox today",
  "{name} from {city} looked at portable motors",
  "{count} repower inquiries in the last 24 hours",
  "{name} from {city} shared a quote",
  "Top cottage pick on {lake}: {model}",
  "{count} customers checked availability on {model}",
  "{name} from {city} asked about prop options",
  "{count} people viewed 4-stroke fuel economy",
  "Hot today near {lake}: {model}"
] as const;
