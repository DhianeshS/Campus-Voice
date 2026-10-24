import { MessageSquareShare, Shield, Layers, Sparkles } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-[#FFFDF8] border-t border-[#E5E0D5] mt-auto select-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand & Mission */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#365442] text-[#FFFDF8] flex items-center justify-center shadow-xs">
                <MessageSquareShare className="w-4 h-4" />
              </div>
              <span className="font-bold text-[#292F2B] text-base tracking-tight">
                CampusVoice
              </span>
            </div>

            <p className="text-xs font-serif italic text-[#365442]">
              "Your Campus. Your Voice. A Better Tomorrow."
            </p>

            <p className="text-xs text-[#68716A] max-w-sm leading-relaxed">
              A premium, transparent student grievance and feedback ecosystem engineered for institutional accountability and modern campus life.
            </p>

            <div className="flex items-center gap-2 text-[11px] text-[#68716A] pt-1">
              <Layers className="w-3.5 h-3.5 text-[#496B58]" />
              <span>CampusVoice Official Design System • Minimalist SaaS Standard</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#292F2B] mb-3">
              Platform Features
            </h4>
            <ul className="space-y-2 text-xs text-[#68716A]">
              <li className="hover:text-[#292F2B] transition-colors">Issue Categorization</li>
              <li className="hover:text-[#292F2B] transition-colors">Progress Lifecycles</li>
              <li className="hover:text-[#292F2B] transition-colors">Administrative Triage</li>
              <li className="hover:text-[#292F2B] transition-colors">Verified Student Feedback</li>
            </ul>
          </div>

          {/* Design System & Architecture */}
          <div>
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#292F2B] mb-3">
              Design Architecture
            </h4>
            <div className="space-y-2 text-xs text-[#68716A]">
              <div className="flex items-center gap-1.5 text-[#365442]">
                <Shield className="w-3.5 h-3.5 text-[#496B58]" />
                <span className="font-medium">Warm Cream & Sage Palette</span>
              </div>
              <p className="text-[11px] leading-relaxed text-[#8C948E]">
                Restrained borders, accessible touch targets, and typography pairing Plus Jakarta Sans with subtle Lora serif accents.
              </p>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-[#E5E0D5] mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-[#68716A] gap-4">
          <p>© {new Date().getFullYear()} CampusVoice. All rights reserved.</p>
          <div className="flex items-center gap-2 text-[11px]">
            <Sparkles className="w-3.5 h-3.5 text-[#B8755D]" />
            <span>Built with intentional craftsmanship and natural materials</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
