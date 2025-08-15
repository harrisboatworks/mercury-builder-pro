import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export default function PreviewRedesign() {
  return (
    <div className="min-h-screen bg-white">
      {/* Preview Notice Banner */}
      <div className="bg-yellow-100 border-b border-yellow-200 p-3 text-center">
        <p className="text-yellow-800 font-medium">
          🔍 PREVIEW MODE - This is a mockup of the proposed Mercury redesign
          <Link to="/" className="ml-4 text-blue-600 underline">← Back to Current Site</Link>
        </p>
      </div>

      {/* New Header - Mercury Branded */}
      <header className="sticky top-0 z-50 bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <img src="/lovable-uploads/ad0af415-f838-48e5-b716-099ec66b7136.png" alt="Mercury Authorized Dealer" className="h-8" />
          </div>
          <nav className="hidden md:flex gap-6 items-center">
            <a href="#engines" className="text-gray-700 hover:text-black transition-colors">Engines</a>
            <a href="#financing" className="text-gray-700 hover:text-black transition-colors">Financing</a>
            <a href="#service" className="text-gray-700 hover:text-black transition-colors">Service</a>
            <button className="bg-red-600 text-white px-6 py-2 rounded-full font-semibold hover:bg-red-700 transition-colors">
              Get Quote
            </button>
          </nav>
          <button className="md:hidden text-2xl">☰</button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative h-[70vh] min-h-[500px]">
        <div className="absolute inset-0 bg-gradient-to-r from-gray-100 to-gray-200"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-transparent">
          <div className="max-w-7xl mx-auto px-4 h-full flex items-center">
            <div className="max-w-xl">
              <div className="h-20 mb-6 bg-red-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">MERCURY REPOWER CENTER</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                Power Your Next Adventure
              </h1>
              <p className="text-xl text-gray-200 mb-8">
                Get factory pricing on Mercury outboards from Vancouver's authorized dealer
              </p>
              <button className="bg-red-600 text-white px-8 py-4 rounded-full text-lg font-semibold hover:bg-red-700 transition-colors">
                Get Your Quote →
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-red-600">25+</div>
              <div className="text-gray-600 mt-2">Years as Mercury Dealer</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-red-600">3-5 Year</div>
              <div className="text-gray-600 mt-2">Factory Warranty</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-red-600">0%</div>
              <div className="text-gray-600 mt-2">Financing Available</div>
            </div>
          </div>
        </div>
      </section>

      {/* Quote Form */}
      <section className="py-16 bg-white" id="quote">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-8 text-black">Get Your Mercury Quote</h2>
          
          <div className="bg-gray-50 rounded-2xl p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <select className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-white text-black">
                <option>Select Horsepower Range</option>
                <option>2.5 - 20 HP</option>
                <option>25 - 60 HP</option>
                <option>75 - 150 HP</option>
                <option>175 - 300 HP</option>
                <option>350 - 600 HP</option>
              </select>
              
              <select className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-white text-black">
                <option>Boat Type</option>
                <option>Fishing</option>
                <option>Pontoon</option>
                <option>Runabout</option>
                <option>Commercial</option>
              </select>
              
              <input 
                type="text" 
                placeholder="Your Name" 
                className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-white text-black placeholder-gray-500"
              />
              
              <input 
                type="tel" 
                placeholder="Phone Number" 
                className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-white text-black placeholder-gray-500"
              />
              
              <input 
                type="email" 
                placeholder="Email" 
                className="w-full px-4 py-3 rounded-lg border border-gray-300 md:col-span-2 bg-white text-black placeholder-gray-500"
              />
            </div>
            
            <button className="w-full mt-6 bg-red-600 text-white py-4 rounded-full text-lg font-semibold hover:bg-red-700 transition-colors">
              Get My Quote →
            </button>
            
            <p className="text-center text-gray-500 text-sm mt-4">
              Factory direct pricing • No obligation • Same-day response
            </p>
          </div>
        </div>
      </section>

      {/* Engine Showcase */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12 text-black">Choose Your Mercury Power</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              { name: 'Verado', hp: '175-600 HP', description: 'Ultimate Luxury' },
              { name: 'FourStroke', hp: '2.5-350 HP', description: 'Proven Reliability' },
              { name: 'Pro XS', hp: '115-300 HP', description: 'Tournament Performance' },
              { name: 'SeaPro', hp: '25-400 HP', description: 'Commercial Grade' }
            ].map((engine, index) => (
              <div key={index} className="bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow">
                <div className="w-full h-48 bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                  <span className="text-gray-600 font-semibold">{engine.name} Engine</span>
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-lg text-black">{engine.name}</h3>
                  <p className="text-gray-600 text-sm">{engine.hp}</p>
                  <p className="text-red-600 font-semibold mt-2">{engine.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black text-white py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-2">
              <img src="/lovable-uploads/ad0af415-f838-48e5-b716-099ec66b7136.png" alt="Mercury Authorized Dealer" className="h-12 mb-4" />
              <p className="text-gray-400">
                Your trusted Mercury dealer in Vancouver. Factory-trained technicians and genuine Mercury parts.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Services</h4>
              <ul className="text-gray-400 space-y-2">
                <li>Engine Sales</li>
                <li>Installation</li>
                <li>Service & Repair</li>
                <li>Parts & Accessories</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Contact</h4>
              <div className="text-gray-400 space-y-2">
                <p>Vancouver, BC</p>
                <p>(604) 555-0123</p>
                <p>info@mercurydealer.ca</p>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Mobile Sticky CTA */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white shadow-2xl md:hidden z-50 border-t">
        <button className="w-full bg-red-600 text-white py-4 rounded-full font-bold text-lg hover:bg-red-700 transition-colors">
          Get Quote Now
        </button>
      </div>

      {/* Preview Action Buttons */}
      <div className="fixed top-20 right-4 z-50 space-y-2">
        <Button 
          onClick={() => window.confirm('Apply this Mercury redesign to your live site?')}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg shadow-lg"
        >
          ✅ Apply Changes
        </Button>
        <Link to="/">
          <Button 
            variant="outline"
            className="bg-white hover:bg-gray-50 text-black px-4 py-2 rounded-lg shadow-lg border"
          >
            ← Keep Current
          </Button>
        </Link>
      </div>
    </div>
  );
}