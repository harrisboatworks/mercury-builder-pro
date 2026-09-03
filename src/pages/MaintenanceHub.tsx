import { Link } from 'react-router-dom';
import { Award, Users, MapPin, Wrench } from 'lucide-react';
import { HubPage } from '@/components/hub/HubPage';

export default function MaintenanceHub() {
  return (
    <HubPage
      path="/maintenance"
      metaTitle="Mercury Outboard Repair & Maintenance Ontario | HBW"
      metaDescription="Mercury outboard repair, seasonal maintenance, and troubleshooting from a Mercury Premier Dealer in Ontario. Spring commissioning, winterization, and diagnostics."
      breadcrumbName="Mercury Maintenance"
      lastReviewedISO="2026-07-26"
      lastReviewedLabel="July 2026"
      h1="Mercury Outboard Repair & Maintenance Guide for Ontario (2026)"
      subhead="Mercury outboard repair, seasonal service, and troubleshooting. A practical Ontario cycle for protecting reliability and catching problems before summer."
      primaryCTA={{ label: 'Submit a service request', to: 'https://hbw.wiki/service' }}
      phoneNumber="(905) 342-2153"
      directAnswer={
        <>
          Mercury outboard repair and maintenance in Ontario follows a four-part
          seasonal cycle: spring commissioning (April-May), summer mid-season
          check (July if running heavy hours), fall winterization
          (October-November), and winter storage. Regular service and proper
          storage preparation help prevent avoidable fuel, cooling, battery,
          and freeze-related problems. The exact interval, parts, lubricant,
          and fluid specification depends on the engine model and serial
          number, so the owner&apos;s manual for that engine is the controlling
          source. For most recreational models, schedule service at 100 hours
          or at least annually, whichever comes first. Physical service work
          pauses from December 1 until the marina reopens in early April;
          quotes and planning can continue during the closure.
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
          { season: 'Fall (Oct-Nov)', service: 'Winterization: treat fuel, change gearcase lubricant, follow the model-specific storage procedure', crit: 'Critical' },
          { season: 'Winter', service: 'Storage: visual checks and battery care for your setup', crit: 'Light' },
        ],
        footnote: <>Complete the service request, then drop the boat off anytime, including after hours.</>,
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
          heading: "When something's wrong: troubleshooting guides",
          cards: [
            { title: "Mercury Outboard Won't Start Troubleshooting", description: 'Diagnose spring no-starts step by step.', to: '/blog/mercury-outboard-wont-start-troubleshooting' },
            { title: 'Outboard Overheating: Emergency Guide', description: 'What to do on the water right now.', to: '/blog/outboard-overheating-emergency-guide' },
            { title: 'Mercury Overheating at Idle: Fix Guide', description: 'Low-speed overheat causes and fixes.', to: '/blog/mercury-outboard-overheating-at-idle-fix-ontario' },
            { title: 'Mercury Overheat at High Speed', description: 'High-RPM overheat, usually cooling flow.', to: '/blog/mercury-outboard-overheat-high-speed' },
            { title: 'Overheat Alarm Decoder', description: 'What the horn pattern means.', to: '/blog/mercury-outboard-overheat-alarm-decoder' },
            { title: 'Mercury Beeping Codes Guide', description: 'Beep patterns and what they mean.', to: '/blog/mercury-outboard-beeping-codes-guide' },
            { title: 'SmartCraft Alarm Codes Encyclopedia', description: 'Every SmartCraft fault code, plain English.', to: '/blog/mercury-smartcraft-alarm-codes-encyclopedia' },
            { title: 'Mercury Fault Code Lookup', description: 'Legacy VesselView IDs and modern UFC pairs by engine family.', to: '/blog/mercury-outboard-fault-codes-lookup' },
            { title: 'Milky Gearcase Oil: Meaning & Cost', description: 'Water in the lower unit, next steps.', to: '/blog/milky-gearcase-oil-meaning-cost-ontario' },
            { title: 'Mercury Impeller Replacement: When They Fail', description: 'The single most common Mercury repair.', to: '/blog/mercury-impeller-replacement-when-they-fail' },
            { title: 'Bilge Pump Troubleshooting Guide', description: 'When the pump quits or runs constantly.', to: '/blog/bilge-pump-troubleshooting-guide' },
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
      whyHbwIntro="Mercury-focused service from an established Ontario shop."
      whyHbw={[
        { icon: <Award className="h-5 w-5" aria-hidden="true" />, title: 'Mercury Premier dealer technicians', description: 'Mercury-certified, factory-trained.' },
        { icon: <Users className="h-5 w-5" aria-hidden="true" />, title: '60 years of service experience', description: 'Three generations of HBW techs.' },
        { icon: <Wrench className="h-5 w-5" aria-hidden="true" />, title: 'Computer diagnostic for modern Mercurys', description: 'Fault code reading on post-2010 EFI motors.' },
        { icon: <MapPin className="h-5 w-5" aria-hidden="true" />, title: 'Shop and marina support', description: 'Outdoor storage with professional shrink wrap, outdoor uncovered storage, or shrink-wrap-only service; parts and electronics integration during our open season. No indoor or heated boat storage.' },
      ]}
      faqs={[
        { question: 'How often should I service my Mercury?', answer: "Follow the maintenance schedule for your exact engine model and serial number. For most recreational Mercury outboards, schedule service at 100 hours or at least annually, whichever comes first, plus proper storage preparation before freezing weather. High-hour and commercial use may require more frequent service." },
        { question: "What's the most important Mercury maintenance task?", answer: "There is no single task that replaces the full schedule. Use the owner's manual for your exact engine, keep up with annual or 100-hour service, and prepare the fuel, cooling, battery, and gearcase systems properly before winter storage." },
        { question: 'How much does Mercury maintenance cost?', answer: "Varies by motor size, boat type, and what's included. Basic spring commissioning plus fall winterization is the smallest bill. Bundles with impeller replacement, anode replacement, and other wear items run more. Contact us for specific quotes." },
        { question: 'Can I service my own Mercury?', answer: 'Some service yes, especially fluid changes, plug inspection, and visual maintenance. Tasks like water-pump impeller replacement, EFI fuel system service, and lower-unit work should be left to a Mercury dealer.' },
        { question: 'How long does a Mercury last with proper maintenance?', answer: "There is no responsible universal hour or year estimate. Engine family, duty cycle, corrosion exposure, storage, service history, installation, and operating conditions all matter. A documented inspection and service history is more useful than a generic lifespan claim." },
        { question: 'What kind of oil does my Mercury need?', answer: "Use only the oil viscosity and specification listed for your exact engine model and serial number in the Mercury owner's manual or service information. Mercury requirements differ by engine family, temperature range, and model year." },
        { question: "Why won't my Mercury start in spring?", answer: 'Common starting points include battery condition and connections, old or contaminated fuel, fuel delivery, the emergency-stop lanyard, controls not fully in neutral, and storage-related issues. Follow the model-specific troubleshooting sequence and avoid repeated cranking if an alarm or abnormal condition is present.' },
        { question: 'When should I submit a spring service request?', answer: 'Complete hbw.wiki/service, then drop the boat off anytime, including after hours. Physical marina work resumes when HBW reopens in early April.' },
        { question: 'Do you repair Mercury outboards?', answer: "Yes, during our open season. Mercury and MerCruiser engine repair includes diagnostics, impellers, water pumps, fuel systems, gearcases, and full 100-hour services. Physical service work pauses from December 1 until the marina reopens in early April, but quotes and planning can continue. Start with a service request at hbw.wiki/service." },
      ]}
      secondaryCTA={{
        heading: 'Considering a repower instead of more service?',
        body: <>Old motor not worth the next bill? Build a Mercury repower quote.</>,
        button: { label: 'Build a quote', to: '/quote/motor-selection' },
      }}
    />
  );
}
