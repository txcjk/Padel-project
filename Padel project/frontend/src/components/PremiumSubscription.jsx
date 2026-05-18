import { useState } from 'react';
import { Zap, BarChart3, Crown, ShieldCheck, Infinity, X } from 'lucide-react';

export default function PremiumSubscription({ onClose }) {
  const [selectedPlan, setSelectedPlan] = useState('annual');

  const benefits = [
    {
      icon: <Infinity className="w-5 h-5 text-neon-lime" />,
      title: "Matchs Ranked Illimités :",
      description: "Ne soyez plus limité à 1 match classé par mois. Grimper dans le classement Elo n'attend pas."
    },
    {
      icon: <Zap className="w-5 h-5 text-neon-lime" />,
      title: "Alertes \"LAST\" Prioritaires :",
      description: "Recevez les notifications de 4ème joueur manquant instantanément par Push. Les joueurs gratuits les voient 15 minutes plus tard."
    },
    {
      icon: <BarChart3 className="w-5 h-5 text-neon-lime" />,
      title: "Statistiques de Pro :",
      description: "Accédez aux graphiques détaillés de votre progression Elo, votre historique de victoires/défaites par club, et analysez vos performances."
    },
    {
      icon: <Crown className="w-5 h-5 text-neon-violet" />,
      title: "Statut Élite Public :",
      description: "Débloquez un contour de carte de joueur exclusif aux reflets violets néon et un badge \"Élite\" visible par toute la communauté sur le classement général."
    }
  ];

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden flex flex-col items-center justify-center">
      {/* Close Button */}
      {onClose && (
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-xl bg-zinc-900 border border-zinc-800/80 hover:border-zinc-700/80 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-all cursor-pointer z-50 shadow-lg hover:scale-105"
        >
          <X className="w-5 h-5" />
        </button>
      )}

      {/* Background glowing decorations */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-neon-violet/10 rounded-full filter blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-neon-lime/5 rounded-full filter blur-[120px] pointer-events-none" />

      {/* Main Container */}
      <div className="relative w-full max-w-4xl mx-auto animate-slide-in">
        
        {/* Header Section */}
        <div className="text-center space-y-4 mb-12">
          <div className="inline-flex items-center justify-center p-3 mb-2 rounded-2xl bg-zinc-900 border border-zinc-800 shadow-xl">
            <Crown className="w-8 h-8 text-neon-violet" />
          </div>
          <h1 className="font-display font-extrabold text-4xl sm:text-5xl tracking-tight text-white uppercase text-glow-violet">
            Rejoignez l'Élite elo<span className="text-neon-lime">match</span>
          </h1>
          <p className="text-zinc-400 text-lg max-w-2xl mx-auto font-medium">
            Dominez les terrains, accédez au matchmaking en temps réel et affichez votre vrai rang.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          
          {/* PRICING CARDS */}
          <div className="flex flex-col gap-6">
            {/* Monthly Card */}
            <div 
              onClick={() => setSelectedPlan('monthly')}
              className={`relative p-6 rounded-2xl border-2 transition-all duration-300 cursor-pointer bg-zinc-900 overflow-hidden group hover:border-zinc-700 ${selectedPlan === 'monthly' ? 'border-neon-lime shadow-[0_0_20px_rgba(163,230,53,0.15)]' : 'border-zinc-800'}`}
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-display font-bold text-xl text-zinc-100 uppercase tracking-wide">Mensuel</h3>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selectedPlan === 'monthly' ? 'border-neon-lime bg-neon-lime/20' : 'border-zinc-700'}`}>
                  {selectedPlan === 'monthly' && <div className="w-2.5 h-2.5 rounded-full bg-neon-lime" />}
                </div>
              </div>
              <div className="mb-2">
                <span className="text-3xl font-extrabold text-white">3,99 €</span>
                <span className="text-zinc-500 font-medium"> / mois</span>
              </div>
              <p className="text-sm text-zinc-400 mb-6">Sans engagement, annulable à tout moment.</p>
              
              <button className="w-full py-3.5 rounded-xl bg-zinc-800 border border-zinc-700 text-zinc-200 font-bold uppercase tracking-wider text-sm transition-all hover:bg-zinc-700 cursor-pointer">
                Devenir Élite
              </button>
            </div>

            {/* Annual Card */}
            <div 
              onClick={() => setSelectedPlan('annual')}
              className={`relative p-6 pt-8 rounded-2xl border-2 transition-all duration-300 cursor-pointer bg-zinc-900 group hover:scale-[1.02] ${selectedPlan === 'annual' ? 'border-neon-violet shadow-[0_0_30px_rgba(168,85,247,0.25)]' : 'border-zinc-800 hover:border-neon-violet/50'}`}
            >
              {/* Highlight Banner — top gradient line */}
              <div className="absolute top-0 left-0 w-full h-1 rounded-t-2xl bg-gradient-to-r from-neon-violet-deep via-neon-violet to-neon-violet-deep" />

              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <h3 className="font-display font-bold text-xl text-zinc-100 uppercase tracking-wide">Annuel</h3>
                  <span className="bg-neon-violet/20 border border-neon-violet/50 text-neon-violet text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full glow-violet whitespace-nowrap">
                    Le Choix des Pros
                  </span>
                </div>
                <div className={`shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center ${selectedPlan === 'annual' ? 'border-neon-violet bg-neon-violet/20' : 'border-zinc-700'}`}>
                  {selectedPlan === 'annual' && <div className="w-2.5 h-2.5 rounded-full bg-neon-violet" />}
                </div>
              </div>
              <div className="mb-2">
                <span className="text-4xl font-extrabold text-white text-glow-violet">29,99 €</span>
                <span className="text-zinc-400 font-medium"> / an</span>
              </div>
              <p className="text-sm text-neon-lime mb-6 font-medium">Soit seulement 2,50 € / mois (Économisez 35%).</p>
              
              <button className="w-full py-3.5 rounded-xl bg-neon-violet text-white font-black uppercase tracking-wider text-sm transition-all hover:bg-neon-violet-deep hover:shadow-[0_0_25px_rgba(168,85,247,0.5)] cursor-pointer">
                S'abonner et Économiser
              </button>
            </div>
          </div>

          {/* BENEFITS LIST */}
          <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-6 md:p-8 backdrop-blur-xl h-full flex flex-col justify-center">
            <h3 className="font-display font-extrabold text-lg text-white uppercase tracking-wide mb-6 flex items-center gap-2">
              <span className="w-8 h-1 bg-neon-violet rounded-full"></span>
              Avantages du Statut Élite
            </h3>
            
            <div className="space-y-6">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex gap-4">
                  <div className="shrink-0 mt-1">
                    <div className="w-8 h-8 rounded-lg bg-zinc-950 border border-zinc-800 flex items-center justify-center shadow-inner">
                      {benefit.icon}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-bold text-zinc-100 text-sm mb-1">{benefit.title}</h4>
                    <p className="text-zinc-400 text-sm leading-relaxed">{benefit.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Footer Disclaimer */}
        <div className="mt-12 flex items-start sm:items-center justify-center gap-3 text-zinc-500 text-xs font-medium bg-zinc-900/40 py-3 px-4 rounded-xl sm:rounded-full border border-zinc-800/60 max-w-fit mx-auto">
          <ShieldCheck className="w-4 h-4 text-zinc-400 shrink-0" />
          <span>Paiement sécurisé. Facturation récurrente, résiliation en un clic depuis les paramètres de votre profil.</span>
        </div>

      </div>
    </div>
  );
}
