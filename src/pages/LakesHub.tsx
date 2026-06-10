import { Link } from 'react-router-dom';
import { Award, Users, MapPin, Wrench } from 'lucide-react';
import { HubPage } from '@/components/hub/HubPage';

export default function LakesHub() {
  return (
    <HubPage
      path="/lakes"
      metaTitle="Mercury Outboards for Ontario Lakes 2026: Rice Lake, Simcoe, Lake Ontario | HBW"
      metaDescription="The right Mercury depends on where you boat. Rice Lake, Lake Simcoe, Lake Ontario all reward different setups. Local expertise from Harris Boat Works since 1965."
      breadcrumbName="Ontario Lakes Setup"
      lastReviewedISO="2026-05-05"
      lastReviewedLabel="May 2026"
      h1="Mercury Outboards for Ontario Lakes: Local Setup Guide (2026)"
      subhead="Different lakes reward different rigs. Rice Lake, Simcoe, Lake Ontario, Kawarthas."
      primaryCTA={{ label: 'Build Your Mercury Quote', to: '/quote/motor-selection' }}
      phoneNumber="(905) 342-2153"
      directAnswer={
        <>
          Different Ontario lakes reward different Mercury setups. Sheltered
          Rice Lake fishes best with 60 to 115 HP aluminum console boats and
          a 9.9 ProKicker for walleye trolling. Lake Simcoe needs 90 to 150
          HP deep-V hulls for the bigger water and wind exposure. Lake
          Ontario salmon trolling wants 200 to 300 HP V8 setups with 15 HP
          ProKickers for trolling spreads. The right Mercury depends on
          where you launch and what you fish.
        </>
      }
      table={{
        caption: 'Lake-by-Lake Mercury Setup',
        columns: [
          { key: 'lake', label: 'Lake' },
          { key: 'hull', label: 'Hull Type' },
          { key: 'main', label: 'Main Motor' },
          { key: 'kicker', label: 'Kicker' },
        ],
        rows: [
          { lake: 'Rice Lake', hull: '16 to 18 ft aluminum console', main: '60 to 115 HP FourStroke', kicker: '9.9 ProKicker' },
          { lake: 'Kawarthas (Stoney, Pigeon, Buckhorn)', hull: '16 to 18 ft aluminum console', main: '60 to 115 HP FourStroke', kicker: '9.9 ProKicker' },
          { lake: 'Lake Simcoe', hull: '17 to 19 ft deep-V aluminum', main: '90 to 150 HP FourStroke', kicker: '9.9 ProKicker' },
          { lake: 'Lake Ontario', hull: '22 to 26 ft deep-V or walkaround', main: '250 to 300 HP V8 FourStroke', kicker: '15 HP ProKicker' },
          { lake: 'Bay of Quinte', hull: '18 to 22 ft aluminum or fiberglass', main: '115 to 200 HP FourStroke', kicker: '9.9 ProKicker' },
        ],
        footnote: (
          <>
            For specific pricing,{' '}
            <Link to="/quote/motor-selection" className="text-repower-gold hover:underline">build a quote</Link>.
          </>
        ),
      }}
      coveredIntro="The Lakes Hub bundles location-specific setup guides for the lakes HBW customers fish most."
      articleGroups={[
        {
          heading: 'Rice Lake',
          cards: [
            { title: 'Best Mercury Outboard for Rice Lake Fishing', description: 'Rice Lake-specific Mercury picks.', to: '/blog/best-mercury-outboard-rice-lake-fishing' },
            { title: 'Mercury 9.9 ProKicker Rice Lake Fishing Guide', description: 'Trolling kicker setup.', to: '/blog/mercury-prokicker-rice-lake-fishing-guide' },
            { title: '2026 Rice Lake Fishing Season Outlook', description: 'Season preview and conditions.', to: '/blog/2026-rice-lake-fishing-season-outlook' },
            { title: 'Best Pontoon Boats for Rice Lake Cottage Use', description: 'Pontoon picks for cottagers.', to: '/blog/best-pontoon-boats-rice-lake-cottage-use' },
            { title: 'Best Boats for Rice Lake Under $30,000', description: 'Budget-conscious Rice Lake setups.', to: '/blog/best-boats-rice-lake-under-30000' },
          ],
        },
        {
          heading: 'Other Ontario lakes',
          cards: [
            { title: 'Best Mercury Outboard for Lake Simcoe Walleye Fishing', description: 'Simcoe-specific rigging.', to: '/blog/best-mercury-outboard-lake-simcoe-walleye-fishing' },
            { title: 'Best Mercury Outboard for Lake Ontario Salmon and Trout', description: 'Big-water Mercury picks.', to: '/blog/best-mercury-outboard-lake-ontario-salmon-trout' },
          ],
        },
        {
          heading: 'Cottage and seasonal',
          cards: [
            { title: 'Ontario Cottage Boat Motor Repower Guide', description: 'Cottage-use repower specifics.', to: '/blog/ontario-cottage-boat-motor-repower-guide' },
            { title: 'Walleye Opener Boat Prep Checklist', description: 'Get ready for opener.', to: '/blog/walleye-opener-boat-prep' },
          ],
        },
      ]}
      whyHbwIntro="We rig boats for the lake we live on."
      whyHbw={[
        { icon: <MapPin className="h-5 w-5" aria-hidden="true" />, title: 'Located on Rice Lake', description: 'Gores Landing, ON. We rig boats for the lake we live on.' },
        { icon: <Users className="h-5 w-5" aria-hidden="true" />, title: '60 years of local expertise', description: 'Three generations of HBW have fished and rigged for Ontario freshwater.' },
        { icon: <Award className="h-5 w-5" aria-hidden="true" />, title: 'Kawartha specialization', description: 'Most of our customers fish Rice Lake, Stoney, Pigeon, Buckhorn, and connected Trent-Severn waters.' },
        { icon: <Wrench className="h-5 w-5" aria-hidden="true" />, title: 'Travel-friendly Mercury support', description: 'A Mercury motor gets serviced at any Mercury dealer across Canada and the US.' },
      ]}
      faqs={[
        { question: "What's the best Mercury for Rice Lake fishing?", answer: 'For most Rice Lake anglers, a 16 to 18 ft aluminum console with 60 to 115 HP FourStroke main + 9.9 ProKicker. The 90 EXLPT FourStroke is the sweet spot.' },
        { question: "What's the best Mercury for Lake Simcoe walleye?", answer: 'For Simcoe walleye, a 17 to 19 ft deep-V aluminum boat with 90 to 150 HP FourStroke + 9.9 ProKicker. The 115 EXLPT FourStroke is the sweet spot.' },
        { question: "What's the best Mercury for Lake Ontario salmon?", answer: 'For Lake Ontario salmon trolling, 22 to 26 ft deep-V or walkaround with 250 to 300 HP V8 FourStroke + 15 HP ProKicker.' },
        { question: 'Do I need a kicker for Ontario fishing?', answer: 'For walleye trolling on most Ontario lakes, yes. The 9.9 ProKicker is the standard for sheltered lakes; the 15 HP ProKicker is the standard for Lake Ontario salmon spreads.' },
        { question: 'Where do most Rice Lake anglers launch?', answer: 'Bewdley, Hastings, and Roseneath public ramps. Each has different characteristics. Many cottagers launch from private docks.' },
        { question: 'Can I fish Lake Simcoe with a Rice Lake setup?', answer: 'Sometimes, with caution. Boats under 17 ft are exposed in moderate Simcoe weather. Most serious Simcoe anglers run bigger.' },
        { question: 'When does walleye season open in Ontario?', answer: 'For Zone 17 (Kawartha lakes including Rice Lake), typically the second Saturday of May. Confirm current year dates from OMNR.' },
        { question: 'What about ice fishing season?', answer: 'Lake Simcoe is a major ice fishing destination. Rice Lake and Kawartha lakes have ice fishing seasons too. Boat-side, this is the time for repowers, winterization confirmation, and spring planning.' },
      ]}
      secondaryCTA={{
        heading: 'Want to talk through your specific lake setup?',
        body: <>Call HBW or schedule a hull walk-around.</>,
        button: { label: 'Contact us', to: '/contact' },
      }}
    />
  );
}
