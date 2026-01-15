
import React, { useState, useEffect, useCallback } from 'react';
import { 
  AppStep, 
  UserPreferences, 
  Recommendation, 
  VibeType, 
  ContentType, 
  LanguageType,
  EraType
} from './types';
import { VIBES, LANGUAGES, CONTENT_TYPES, ERA_OPTIONS, PLACEHOLDER_POSTER } from './constants';
import { getRecommendations, getRecommendationsByMovies } from './services/geminiService';
import { fetchOMDBMetadata, OMDBMetadata } from './services/omdbService';

// --- Tracking Helper ---
const trackEvent = (name: string, params?: any) => {
  console.log(`[EVENT] ${name}`, params || '');
};

const App: React.FC = () => {
  const [step, setStep] = useState<AppStep>(AppStep.ENTRY);
  const [prefs, setPrefs] = useState<UserPreferences>({
    vibes: [],
    content_type: [],
    language_preference: [],
    era_preference: [],
    magic_text: '',
    input_movies: ''
  });
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [metadataMap, setMetadataMap] = useState<Record<string, OMDBMetadata>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(3);
  const [activeMode, setActiveMode] = useState<'questionnaire' | 'fun' | null>(null);

  // Listen for global unhandled errors
  useEffect(() => {
    const handleGlobalError = () => {
      setIsLoading(false);
      setError("A connection error occurred. Please verify your VITE_API_KEY.");
    };
    window.addEventListener('app-error' as any, handleGlobalError);
    return () => window.removeEventListener('app-error' as any, handleGlobalError);
  }, []);

  // --- Handlers ---
  const toggleVibe = (vibe: VibeType) => {
    setPrefs(prev => ({
      ...prev,
      vibes: prev.vibes.includes(vibe) 
        ? prev.vibes.filter(v => v !== vibe)
        : [...prev.vibes, vibe]
    }));
    trackEvent('vibe_selected', { vibe });
  };

  const toggleContentType = (type: ContentType) => {
    setPrefs(prev => ({
      ...prev,
      content_type: prev.content_type.includes(type)
        ? prev.content_type.filter(t => t !== type)
        : [...prev.content_type, type]
    }));
    trackEvent('content_type_selected', { type });
  };

  const toggleLanguage = (lang: LanguageType) => {
    setPrefs(prev => ({
      ...prev,
      language_preference: prev.language_preference.includes(lang)
        ? prev.language_preference.filter(l => l !== lang)
        : [...prev.language_preference, lang]
    }));
    trackEvent('language_selected', { language: lang });
  };

  const toggleEra = (era: EraType) => {
    setPrefs(prev => ({
      ...prev,
      era_preference: prev.era_preference.includes(era)
        ? prev.era_preference.filter(e => e !== era)
        : [...prev.era_preference, era]
    }));
    trackEvent('era_selected', { era });
  };

  const handleGenerate = async () => {
    trackEvent('generate_clicked', { mode: activeMode });
    setStep(AppStep.RESULTS);
    setIsLoading(true);
    setError(null);
    const generationStart = Date.now();

    try {
      let results: Recommendation[] = [];
      if (activeMode === 'fun') {
        results = await getRecommendationsByMovies(prefs.input_movies || '');
        setVisibleCount(5); 
      } else {
        results = await getRecommendations(prefs);
        setVisibleCount(3); 
      }

      setRecommendations(results);

      trackEvent('recommendations_generated', {
        count_returned: results.length,
        latency_ms: Date.now() - generationStart
      });

      // Metadata fetching is non-blocking to UI
      results.forEach(async (rec) => {
        try {
          const meta = await fetchOMDBMetadata(rec.title, rec.release_year);
          if (meta) {
            setMetadataMap(prev => ({ ...prev, [rec.title]: meta }));
          }
        } catch (e) {
          console.warn(`Failed to fetch metadata for ${rec.title}`);
        }
      });
    } catch (err: any) {
      console.error("Generation failed:", err);
      if (err.message === "API_KEY_MISSING" || err.message?.includes("API Key")) {
        setError("API Key Error: VITE_API_KEY prefix required.");
      } else {
        setError("We encountered an issue. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleShowMore = () => {
    let nextCount = visibleCount;
    if (visibleCount === 3) {
      nextCount = 6;
    } else {
      nextCount = recommendations.length;
    }
    setVisibleCount(nextCount);
    trackEvent('show_more_clicked');
  };

  const handleNewMood = () => {
    trackEvent('new_mood_clicked');
    setStep(AppStep.ENTRY);
    setError(null);
    setPrefs({ vibes: [], content_type: [], language_preference: [], era_preference: [], magic_text: '', input_movies: '' });
    setRecommendations([]);
    setMetadataMap({});
    setVisibleCount(3);
    setActiveMode(null);
    setIsLoading(false);
  };

  const NewMoodButton = ({ className = "", label = "New Mood" }) => (
    <button 
      onClick={handleNewMood} 
      className={`group relative flex items-center space-x-3 bg-white hover:bg-zinc-100 text-black px-8 py-4 rounded-full transition-all duration-300 shadow-[0_10px_30px_rgba(255,255,255,0.15)] active:scale-95 border border-transparent hover:border-white ${className}`}
    >
      <span className="font-extrabold text-sm tracking-widest uppercase">{label}</span>
      <span className="text-xl group-hover:rotate-180 transition-transform duration-500">🔄</span>
    </button>
  );

  const CardSkeleton = () => (
    <div className="bg-zinc-900 rounded-2xl overflow-hidden border border-white/5 flex flex-col animate-pulse">
      <div className="aspect-[2/3] bg-zinc-800" />
      <div className="p-6 space-y-4">
        <div className="h-3 bg-zinc-800 rounded w-1/4" />
        <div className="h-7 bg-zinc-800 rounded w-3/4" />
        <div className="h-3 bg-zinc-800 rounded w-1/5" />
        <div className="pt-6 border-t border-white/5 space-y-2">
          <div className="h-3 bg-zinc-800 rounded w-full" />
          <div className="h-3 bg-zinc-800 rounded w-5/6" />
        </div>
      </div>
    </div>
  );

  const renderStep = () => {
    switch (step) {
      case AppStep.ENTRY:
        return (
          <div className="max-w-5xl mx-auto pt-16 animate-fade-in px-4">
            <div className="text-center mb-16">
              <h1 className="text-5xl md:text-6xl font-black mb-6 tracking-tight">Find your next watch</h1>
              <div className="inline-flex items-center space-x-2 bg-white/5 border border-white/10 px-6 py-3 rounded-full text-zinc-300 text-sm font-semibold tracking-wide shadow-xl">
                <span>⏱️ Takes less than a minute</span>
                <span className="text-zinc-600 px-2">•</span>
                <span>3 highly-matched recommendations</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
              <button 
                onClick={() => {
                  setActiveMode('questionnaire');
                  setStep(AppStep.VIBE);
                }}
                className="group relative p-10 rounded-[2.5rem] border-2 border-white/10 bg-zinc-900/40 hover:border-netflix-red/50 hover:bg-zinc-800/80 transition-all duration-500 text-left hover:-translate-y-2 flex flex-col h-full shadow-2xl overflow-hidden"
              >
                <div className="absolute top-8 right-8 bg-zinc-950/80 border border-white/10 rounded-lg px-3 py-1.5 text-[10px] font-black tracking-[0.2em] text-zinc-400 group-hover:text-netflix-red transition-colors backdrop-blur-md z-10">
                  🎭 SMART QUIZ
                </div>
                <div className="relative mb-8 w-fit">
                  <div className="text-7xl transform group-hover:scale-110 group-hover:rotate-6 transition-transform duration-700 ease-out">
                    🎭
                  </div>
                </div>
                <h3 className="text-3xl font-black mb-4 tracking-tight">Tell Us Your Mood</h3>
                <p className="text-zinc-400 text-lg leading-relaxed mb-8 flex-grow">
                  Answer a few fun questions and get spot-on picks tailored to your vibe.
                </p>
                <div className="flex items-center text-netflix-red font-black uppercase tracking-widest text-[11px] group-hover:translate-x-3 transition-transform duration-300">
                  Start Quiz <span className="ml-2 text-lg">→</span>
                </div>
              </button>

              <button 
                onClick={() => {
                  setActiveMode('fun');
                  setStep(AppStep.FUN_MODE_INPUT);
                }}
                className="group relative p-10 rounded-[2.5rem] border-2 border-white/10 bg-zinc-900/40 hover:border-netflix-red/50 hover:bg-zinc-800/80 transition-all duration-500 text-left hover:-translate-y-2 flex flex-col h-full shadow-2xl overflow-hidden"
              >
                <div className="absolute top-8 right-8 bg-zinc-950/80 border border-white/10 rounded-lg px-3 py-1.5 text-[10px] font-black tracking-[0.2em] text-zinc-400 group-hover:text-netflix-red transition-colors backdrop-blur-md z-10">
                  💖 FAST MATCH
                </div>
                <div className="relative mb-8 w-fit">
                  <div className="text-7xl transform group-hover:scale-110 group-hover:-rotate-6 transition-transform duration-700 ease-out">
                    💖
                  </div>
                </div>
                <h3 className="text-3xl font-black mb-4 tracking-tight">Start with Favorites</h3>
                <p className="text-zinc-400 text-lg leading-relaxed mb-8 flex-grow">
                  Type 2–5 movies you love and we’ll decode your unique taste profile.
                </p>
                <div className="flex items-center text-netflix-red font-black uppercase tracking-widest text-[11px] group-hover:translate-x-3 transition-transform duration-300">
                  Enter Titles <span className="ml-2 text-lg">→</span>
                </div>
              </button>
            </div>
          </div>
        );

      case AppStep.FUN_MODE_INPUT:
        return (
          <div className="max-w-2xl mx-auto pt-20 animate-fade-in px-4">
            <button onClick={() => setStep(AppStep.ENTRY)} className="text-zinc-500 hover:text-white mb-8 flex items-center group">
              <span className="group-hover:-translate-x-1 transition-transform mr-2">←</span> Back
            </button>
            <h1 className="text-4xl md:text-5xl font-extrabold mb-4 text-center">Your Favorites?</h1>
            <p className="text-zinc-400 text-center mb-12 text-lg">Type 2–5 movies you love.</p>
            <textarea
              className="w-full h-48 bg-zinc-900 border-2 border-white/10 rounded-2xl p-6 text-xl focus:border-netflix-red outline-none transition-all placeholder:text-zinc-700 resize-none mb-4 shadow-inner"
              placeholder="Example: Interstellar, La La Land, Gone Girl..."
              value={prefs.input_movies}
              onChange={(e) => setPrefs({...prefs, input_movies: e.target.value})}
            />
            <div className="flex justify-center mt-8">
              <button 
                disabled={!prefs.input_movies || prefs.input_movies.length < 5}
                onClick={handleGenerate}
                className="bg-netflix-red disabled:opacity-50 hover:bg-red-700 px-12 py-5 rounded-full font-bold text-2xl transition-all shadow-[0_0_30px_rgba(229,9,20,0.4)] active:scale-95"
              >
                Find Matches
              </button>
            </div>
          </div>
        );

      case AppStep.VIBE:
        return (
          <div className="max-w-2xl mx-auto pt-20 animate-fade-in px-4">
            <button onClick={() => setStep(AppStep.ENTRY)} className="text-zinc-500 hover:text-white mb-8 flex items-center group">
              <span className="group-hover:-translate-x-1 transition-transform mr-2">←</span> Back
            </button>
            <h1 className="text-4xl md:text-5xl font-extrabold mb-4 text-center">What’s the vibe?</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {VIBES.map(v => (
                <button
                  key={v.label}
                  onClick={() => toggleVibe(v.label)}
                  className={`p-6 rounded-xl border-2 text-left transition-all duration-300 flex items-center space-x-4 ${
                    prefs.vibes.includes(v.label) 
                      ? 'border-netflix-red bg-netflix-red/10 scale-[1.02]' 
                      : 'border-white/10 bg-zinc-900 hover:border-white/30'
                  }`}
                >
                  <span className="text-2xl">{v.emoji}</span>
                  <span className="font-semibold text-lg">{v.label}</span>
                </button>
              ))}
            </div>
            <div className="mt-12 flex justify-center">
              <button 
                disabled={prefs.vibes.length === 0}
                onClick={() => setStep(AppStep.CONTENT_TYPE)}
                className="bg-netflix-red disabled:opacity-50 hover:bg-red-700 px-10 py-4 rounded-full font-bold text-xl transition-all shadow-lg active:scale-95"
              >
                Next
              </button>
            </div>
          </div>
        );

      case AppStep.CONTENT_TYPE:
        return (
          <div className="max-w-2xl mx-auto pt-20 animate-fade-in px-4">
            <button onClick={() => setStep(AppStep.VIBE)} className="text-zinc-500 hover:text-white mb-8 flex items-center group">
              <span className="group-hover:-translate-x-1 transition-transform mr-2">←</span> Back
            </button>
            <h1 className="text-4xl md:text-5xl font-extrabold mb-12 text-center">I'm looking for...</h1>
            <div className="grid grid-cols-2 gap-6">
              {CONTENT_TYPES.map(t => (
                <button
                  key={t.label}
                  onClick={() => toggleContentType(t.label)}
                  className={`p-10 rounded-2xl border-2 text-center transition-all duration-300 ${
                    prefs.content_type.includes(t.label) 
                      ? 'border-netflix-red bg-netflix-red/10 scale-[1.05]' 
                      : 'border-white/10 bg-zinc-900 hover:border-white/30'
                  }`}
                >
                  <div className="text-5xl mb-4">{t.emoji}</div>
                  <div className="font-bold text-xl">{t.label}</div>
                </button>
              ))}
            </div>
            <div className="mt-12 flex justify-center">
              <button 
                disabled={prefs.content_type.length === 0}
                onClick={() => setStep(AppStep.LANGUAGE)}
                className="bg-netflix-red disabled:opacity-50 hover:bg-red-700 px-10 py-4 rounded-full font-bold text-xl transition-all shadow-lg active:scale-95"
              >
                Next
              </button>
            </div>
          </div>
        );

      case AppStep.LANGUAGE:
        return (
          <div className="max-w-2xl mx-auto pt-20 animate-fade-in px-4">
             <button onClick={() => setStep(AppStep.CONTENT_TYPE)} className="text-zinc-500 hover:text-white mb-8 flex items-center group">
              <span className="group-hover:-translate-x-1 transition-transform mr-2">←</span> Back
            </button>
            <h1 className="text-4xl md:text-5xl font-extrabold mb-4 text-center">Languages?</h1>
            <div className="flex flex-wrap justify-center gap-3 mb-12">
              {LANGUAGES.map(lang => (
                <button
                  key={lang}
                  onClick={() => toggleLanguage(lang)}
                  className={`px-6 py-3 rounded-full border-2 transition-all duration-300 ${
                    prefs.language_preference.includes(lang) 
                      ? 'border-netflix-red bg-netflix-red text-white' 
                      : 'border-white/10 bg-zinc-900 text-zinc-400 hover:border-white/30'
                  }`}
                >
                  {lang}
                </button>
              ))}
            </div>
            <div className="flex justify-center">
              <button 
                disabled={prefs.language_preference.length === 0}
                onClick={() => setStep(AppStep.ERA)}
                className="bg-netflix-red disabled:opacity-50 hover:bg-red-700 px-10 py-4 rounded-full font-bold text-xl transition-all shadow-lg active:scale-95"
              >
                Next
              </button>
            </div>
          </div>
        );

      case AppStep.ERA:
        return (
          <div className="max-w-3xl mx-auto pt-20 animate-fade-in px-4">
             <button onClick={() => setStep(AppStep.LANGUAGE)} className="text-zinc-500 hover:text-white mb-8 flex items-center group">
              <span className="group-hover:-translate-x-1 transition-transform mr-2">←</span> Back
            </button>
            <h1 className="text-4xl md:text-5xl font-extrabold mb-4 text-center">Which era?</h1>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
              {ERA_OPTIONS.map(era => (
                <button
                  key={era.label}
                  onClick={() => toggleEra(era.label)}
                  className={`p-6 rounded-2xl border-2 text-center transition-all duration-300 flex flex-col items-center group ${
                    prefs.era_preference.includes(era.label) 
                      ? 'border-netflix-red bg-netflix-red/10 scale-[1.02]' 
                      : 'border-white/10 bg-zinc-900 hover:border-white/30'
                  }`}
                >
                  <span className="text-4xl mb-3 group-hover:scale-110 transition-transform">{era.emoji}</span>
                  <div className="font-bold text-lg mb-1">{era.label}</div>
                  <div className="text-xs text-zinc-500 leading-tight">{era.description}</div>
                </button>
              ))}
            </div>
            <div className="flex justify-center">
              <button 
                disabled={prefs.era_preference.length === 0}
                onClick={() => setStep(AppStep.MAGIC_TEXT)}
                className="bg-netflix-red disabled:opacity-50 hover:bg-red-700 px-10 py-4 rounded-full font-bold text-xl transition-all shadow-lg active:scale-95"
              >
                Next
              </button>
            </div>
          </div>
        );

      case AppStep.MAGIC_TEXT:
        return (
          <div className="max-w-2xl mx-auto pt-20 animate-fade-in px-4">
             <button onClick={() => setStep(AppStep.ERA)} className="text-zinc-500 hover:text-white mb-8 flex items-center group">
              <span className="group-hover:-translate-x-1 transition-transform mr-2">←</span> Back
            </button>
            <h1 className="text-4xl md:text-5xl font-extrabold mb-4 text-center">Any specific request?</h1>
            <textarea
              className="w-full h-40 bg-zinc-900 border-2 border-white/10 rounded-2xl p-6 text-xl focus:border-netflix-red outline-none transition-all placeholder:text-zinc-700 resize-none"
              placeholder="e.g. watching with parents, solo Sunday night, craving a smart thriller..."
              value={prefs.magic_text}
              onChange={(e) => setPrefs({...prefs, magic_text: e.target.value})}
            />
            <div className="mt-12 flex justify-center">
              <button 
                onClick={handleGenerate}
                className="bg-netflix-red hover:bg-red-700 px-12 py-5 rounded-full font-bold text-2xl transition-all shadow-[0_0_30px_rgba(229,9,20,0.4)] active:scale-95"
              >
                Generate List
              </button>
            </div>
          </div>
        );

      case AppStep.RESULTS:
        return (
          <div className="w-full max-w-7xl mx-auto pt-10 px-6 pb-20 animate-fade-in">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
              <h2 className="text-4xl font-black tracking-tight">
                {isLoading ? (
                  <span className="animate-pulse flex items-center space-x-3">
                    <span className="w-8 h-8 bg-netflix-red rounded-full animate-bounce"></span>
                    <span>Curating your list...</span>
                  </span>
                ) : (
                  activeMode === 'fun' ? 'Based On Your Taste' : 'Our Picks For You'
                )}
              </h2>
              {!isLoading && <NewMoodButton />}
            </div>

            {error ? (
              <div className="max-w-2xl mx-auto p-12 bg-zinc-900/50 border border-red-500/30 rounded-3xl text-center mb-12 backdrop-blur-sm">
                <div className="text-5xl mb-6">🔑</div>
                <h3 className="text-2xl font-bold text-white mb-4">API Key Setup Required</h3>
                <p className="text-zinc-400 text-lg mb-8 leading-relaxed">
                  Your project is successfully deployed, but it can't "see" your API keys yet. <br/><br/>
                  Ensure you added them with the <b>VITE_</b> prefix in Vercel:
                </p>
                <div className="bg-black/50 p-6 rounded-xl mb-8 text-left border border-white/10 font-mono text-sm space-y-2">
                  <div className="flex justify-between text-zinc-400"><span>Variable Name:</span> <span className="text-green-400 font-bold">VITE_API_KEY</span></div>
                  <div className="flex justify-between text-zinc-400"><span>Target:</span> <span>Production</span></div>
                </div>
                <p className="text-zinc-500 text-sm mb-8">
                   If you just added it, you must click <b>Redeploy</b> in your Vercel dashboard.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                   <button 
                    onClick={handleNewMood}
                    className="bg-white text-black px-8 py-3 rounded-full font-bold hover:bg-zinc-200 transition-colors"
                  >
                    Back to Home
                  </button>
                  <button 
                    onClick={() => window.location.reload()}
                    className="bg-zinc-800 text-white px-8 py-3 rounded-full font-bold hover:bg-zinc-700 transition-colors"
                  >
                    Check Again
                  </button>
                </div>
              </div>
            ) : isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {[...Array(activeMode === 'fun' ? 5 : 3)].map((_, i) => (
                  <CardSkeleton key={i} />
                ))}
              </div>
            ) : recommendations.length > 0 ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                  {recommendations.slice(0, visibleCount).map((rec, idx) => {
                    const meta = metadataMap[rec.title];
                    return (
                      <div 
                        key={`${rec.title}-${idx}`} 
                        className="group relative bg-zinc-900 rounded-2xl overflow-hidden border border-white/5 hover:border-netflix-red/30 transition-all duration-500 hover:shadow-[0_20px_50px_rgba(0,0,0,0.8)] hover:-translate-y-2 flex flex-col"
                      >
                        <div className="aspect-[2/3] relative overflow-hidden bg-zinc-800">
                          {meta ? (
                            <img 
                              src={meta.poster || PLACEHOLDER_POSTER} 
                              alt={rec.title} 
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = PLACEHOLDER_POSTER;
                              }}
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-zinc-800 to-zinc-900 animate-pulse flex items-center justify-center">
                               <span className="text-zinc-700 text-6xl">🎬</span>
                            </div>
                          )}
                          
                          {meta?.rating && (
                            <div className="absolute top-4 right-4 bg-black/70 backdrop-blur-md px-3 py-1 rounded-lg border border-white/10 z-10">
                              <span className="text-yellow-400 font-bold text-sm">⭐ {meta.rating}</span>
                            </div>
                          )}

                          <div className="absolute bottom-0 left-0 right-0 p-6 netflix-gradient pointer-events-none z-10">
                             <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-netflix-red mb-1 block">
                               {rec.type} • {rec.language}
                             </span>
                             <h3 className="text-2xl font-bold leading-tight group-hover:text-white transition-colors">{rec.title}</h3>
                             <p className="text-zinc-400 text-xs mt-1">{rec.release_year}</p>
                          </div>
                        </div>
                        <div className="p-6 pt-4 bg-zinc-900 flex-grow border-t border-white/5">
                          <p className="text-zinc-300 italic text-sm leading-relaxed border-l-2 border-netflix-red pl-4">
                            "{rec.one_line_reason}"
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-20 flex flex-col items-center gap-10">
                  {visibleCount < recommendations.length && (
                    <button 
                      onClick={handleShowMore}
                      className="bg-transparent border-2 border-white/20 text-white hover:bg-white hover:text-black px-12 py-4 rounded-full font-bold text-lg transition-all active:scale-95"
                    >
                      Load More
                    </button>
                  )}
                  <NewMoodButton label="Explore New Vibe" />
                </div>
              </>
            ) : (
              <div className="text-center py-40">
                <div className="text-6xl mb-6">🍿</div>
                <h3 className="text-3xl font-bold mb-4">No results found</h3>
                <p className="text-zinc-500 mb-8">Try adjusting your mood or keywords.</p>
                <NewMoodButton label="Start Over" />
              </div>
            )}
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen custom-scrollbar selection:bg-netflix-red/30 overflow-x-hidden bg-[#141414]">
      <nav className="fixed top-0 w-full z-50 px-6 md:px-12 py-6 flex justify-between items-center bg-gradient-to-b from-black/90 to-transparent backdrop-blur-[2px]">
        <div className="flex items-center space-x-2 group cursor-pointer" onClick={handleNewMood}>
          <div className="w-8 h-8 bg-netflix-red rounded flex items-center justify-center font-black text-xl italic transition-transform group-hover:scale-110">B</div>
          <span className="text-xl font-bold tracking-tighter uppercase hidden sm:inline">Binge Watch AI</span>
        </div>
      </nav>

      <main className="pt-24 pb-12 w-full">
        {renderStep()}
      </main>

      <footer className="py-16 px-6 border-t border-white/5 text-center text-zinc-600 text-xs tracking-widest uppercase">
        <p>© {new Date().getFullYear()} Binge Watch AI • Powered by Gemini & OMDB</p>
      </footer>
    </div>
  );
};

export default App;
