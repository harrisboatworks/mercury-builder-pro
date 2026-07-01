import { Link } from 'react-router-dom';
import { Award, Users, MapPin, Wrench } from 'lucide-react';
import { HubPage } from '@/components/hub/HubPage';

export default function MaintenanceHub() {
  return (
    <HubPage
      path="/maintenance"
      metaTitle="Mercury Outboard Maintenance & Service Ontario | HBW"
      metaDescription="Mercury maintenance follows a four-part seasonal cycle. Spring commissioning, summer service, fall winterization, winter storage. Schedule service at Harris Boat Works."
      breadcrumbName="Mercury Maintenance"
      lastReviewedISO="2026-05-05"
      lastReviewedLabel="May 2026"
      h1="Mercury Outboard Maintenance & Service Guide for Ontario (2026)"
      subhead="Spring commissioning, winterization, troubleshooting. The seasonal cycle that keeps Mercurys running 20+ years."
      primaryCTA={{ label: 'Request Service', to: '/contact' }}
      phoneNumber="(905) 342-2153"
      directAnswer={
        <>
          Mercury outboard maintenance in Ontario follows a four-part seasonal
          cycle: spring commissioning (April-May), summer mid-season check
          (July if running heavy hours), fall winterization (October-November),
          and winter storage. Skipped winterization is the leading cause of
          motor failure we see at HBW. Annual maintenance costs less than a
          single major repair on a neglected motor. Modern Mercury FourStrokes
          properly maintained last 1,500 to 2,000+ engine hours, or 10 to 30
          years of recreational use.
        </>
      }
      table={{
        caption: 'Annual Mercury Service Cycle',
        columns: [
          { key: 'season', label: 'Season' },
          { key: 'service', label: 'Service' },
          { key: 'crit', label: 'Critical?' },
        ],
        rows: [
          { season: 'Spring (April-May)', service: 'Commissioning: battery, fuel, cooling, spark, fluids', crit: 'Yes' },
          { season: 'Summer (July)', service: 'Mid-season check (heavy use only)', crit: 'Optional' },
          { season: 'Fall (Oct-Nov)', service: 'Winterization: stabilize fuel, fog engine, drain gearcase', crit: 'Critical' },
          { season: 'Winter', service: 'Storage: monthly visual check, battery trickle', crit: 'Light' },
        ],
        footnote: <>Service slots fill up in March (spring) and October (fall). Book early.</>,
      }}
      coveredIntro="The Maintenance Hub bundles seasonal cycles, troubleshooting, break-in for new motors, and DIY guides."
      articleGroups={[
        {
          heading: 'Seasonal cycles',
          cards: [
            { title: 'Mercury Motor Maintenance: Seasonal Care Tips', description: 'Year-round Mercury care.', to: '/blog/mercury-motor-maintenance-seasonal-tips' },
            { title: 'Spring Outboard Commissioning Checklist', description: 'Bring your motor back from winter.', to: '/blog/spring-outboard-commissioning-checklist' },
            { title: 'DIY Mercury Outboard Winterization Guide', description: 'Step-by-step winterization.', to: '/blog/diy-mercury-outboard-winterization-guide' },
            { title: 'How Much Does Boat Winterization Cost?', description: 'Ontario 2026 winterization pricing.', to: '/blog/boat-winterization-cost-ontario-2026' },
          ],
        },
        {
          heading: 'Troubleshooting',
          cards: [
            { title: "Mercury Outboard Won't Start Troubleshooting", description: 'Diagnose spring no-starts.', to: '/blog/mercury-outboard-wont-start-troubleshooting' },
          ],
        },
        {
          heading: 'New motor care',
          cards: [
            { title: 'Breaking In a New Mercury Motor', description: 'First 10 hours of break-in.', to: '/blog/breaking-in-new-mercury-motor-guide' },
          ],
        },
        {
          heading: 'Pre-season prep',
          cards: [
            { title: 'Walleye Opener Boat Prep Checklist', description: 'Get ready for May opener.', to: '/blog/walleye-opener-boat-prep' },
          ],
        },
      ]}
      whyHbwIntro="Mercury-certified service from a Mercury-only shop."
      whyHbw={[
        { icon: <Award className="h-5 w-5" aria-hidden="true" />, title: 'Mercury Platinum dealer technicians', description: 'Mercury-certified, factory-trained.' },
        { icon: <Users className="h-5 w-5" aria-hidden="true" />, title: '60 years of service experience', description: 'Three generations of HBW techs.' },
        { icon: <Wrench className="h-5 w-5" aria-hidden="true" />, title: 'Computer diagnostic for modern Mercurys', description: 'Fault code reading on post-2010 EFI motors.' },
        { icon: <MapPin className="h-5 w-5" aria-hidden="true" />, title: 'Full marina services', description: 'Storage, hauling, parts, electronics integration.' },
      ]}
      faqs={[
        { question: 'How often should I service my Mercury?', answer: 'Annually at minimum. Spring commissioning to bring the motor back from winter, fall winterization to put it away. Boaters running 200+ hours per season should add a mid-season check in July.' },
        { question: "What's the most important Mercury maintenance task?", answer: 'Winterization. Skipping winterization is the single most common cause of motor failure we see at HBW. Done right, it protects against freeze damage, fuel system gum-up, and corrosion through the storage period.' },
        { question: 'How much does Mercury maintenance cost?', answer: "Varies by motor size, boat type, and what's included. Basic spring commissioning plus fall winterization is the smallest bill. Bundles with impeller replacement, anode replacement, and other wear items run more. Contact us for specific quotes." },
        { question: 'Can I service my own Mercury?', answer: 'Some service yes, especially fluid changes, plug inspection, and visual maintenance. Tasks like water-pump impeller replacement, EFI fuel system service, and lower-unit work should be left to a Mercury dealer.' },
        { question: 'How long does a Mercury last with proper maintenance?', answer: "Modern Mercury FourStrokes properly maintained last 1,500 to 2,000+ engine hours. For a typical recreational boater (50 to 150 hours per season), that's 10 to 30 years." },
        { question: 'What kind of oil does my Mercury need?', answer: 'Modern Mercury FourStrokes use full-synthetic Mercury 25W-50 four-stroke oil. Older motors and 2-strokes use different specifications. Check your owner\'s manual or contact HBW.' },
        { question: "Why won't my Mercury start in spring?", answer: 'Most spring no-starts are battery (40%), stale fuel (25%), or skipped winterization (20%). Run through the basics first.' },
        { question: 'When should I book spring service?', answer: 'February or early March for a May 1 launch. Service slots fill up in March and the late-April bookings often push delivery into late May or June.' },
      ]}
      secondaryCTA={{
        heading: 'Considering a repower instead of more service?',
        body: <>Old motor not worth the next bill? Build a Mercury repower quote.</>,
        button: { label: 'Build a quote', to: '/quote/motor-selection' },
      }}
    />
  );
}
