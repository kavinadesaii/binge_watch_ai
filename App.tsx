
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
  const [visibleCount, setVisibleCount] = useState(3);
  const [activeMode, setActiveMode] = useState<'questionnaire' | 'fun' | null>(null);

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
    const generationStart = Date.now();

    let results: Recommendation[] = [];
    if (activeMode === 'fun') {
      results = await getRecommendationsByMovies(prefs.input_movies || '');
      setVisibleCount(5); 
    } else {
      results = await getRecommendations(prefs);
      setVisibleCount(3); 
    }

    setRecommendations(results);
    setIsLoading(false);

    trackEvent('recommendations_generated', {
      count_returned: results.length,
      latency_ms: Date.now() - generationStart
    });

    results.forEach(async (rec) => {
      const meta = await fetchOMDBMetadata(rec.title, rec.release_year);
      if (meta) {
        setMetadataMap(prev => ({ ...prev, [rec.title]: meta }));
      }
    });
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
    setPrefs({ vibes: [], content_type: [], language_preference: [], era_preference: [], magic_text: '', input_movies: '' });
    setRecommendations([]);
    setMetadataMap({});
    setVisibleCount(3);
    setActiveMode(null);
  };

  // --- Shared Components ---
  const NewMoodButton = ({ className = "", label = "New Mood" }) => (
    <button 
      onClick={handleNewMood} 
      className={`group relative flex items-center space-x-3 bg-white hover:bg-zinc-100 text-black px-8 py-4 rounded-full transition-all duration-300 shadow-[0_10px_30px_rgba(255,255,255,0.15)] active:scale-95 border border-transparent hover:border-white ${className}`}
    >
      <span className="font-extrabold text-sm tracking-widest uppercase">{label}</span>
      <span className="text-xl group-hover:rotate-180 transition-transform duration-500">🔄</span>
      <div className="absolute -inset-1 bg-white/20 rounded-full blur opacity-0 group-hover:opacity-100 transition-opacity"></div>
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

  // --- Rendering Helpers ---
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
                <span className="text-zinc-600 px-2">•</span>
                <span>No endless scrolling</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
              {/* Option 1: Questionnaire */}
              <button 
                onClick={() => {
                  setActiveMode('questionnaire');
                  setStep(AppStep.VIBE);
                }}
                className="group relative p-10 rounded-[2.5rem] border-2 border-white/10 bg-zinc-900/40 hover:border-netflix-red/50 hover:bg-zinc-800/80 transition-all duration-500 text-left hover:-translate-y-2 flex flex-col h-full shadow-2xl overflow-hidden"
              >
                <div className="absolute top-8 right-8 bg-zinc-950/80 border border-white/10 rounded-lg px-3 py-1.5 text-[10px] font-black tracking-[0.2em] text-zinc-400 group-hover:text-netflix-red transition-colors backdrop-blur-md">
                  ⏱️ ~60 SECONDS
                </div>
                <div className="relative mb-8">
                  <div className="text-7xl transform group-hover:scale-110 group-hover:rotate-6 transition-transform duration-700 ease-out">
                    🎭
                  </div>
                  <div className="absolute -top-2 -right-4 text-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100">🔥</div>
                  <div className="absolute bottom-0 -left-6 text-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-200">🎬</div>
                </div>
                <h3 className="text-3xl font-black mb-4 tracking-tight">🎭 Tell Us Your Mood</h3>
                <p className="text-zinc-400 text-lg leading-relaxed mb-8 flex-grow">
                  Answer a few fun questions and get spot-on picks tailored to your vibe.
                </p>
                <div className="flex items-center text-netflix-red font-black uppercase tracking-widest text-[11px] group-hover:translate-x-3 transition-transform duration-300">
                  Select Vibe <span className="ml-2 text-lg">→</span>
                </div>
              </button>

              {/* Option 2: Favorites */}
              <button 
                onClick={() => {
                  setActiveMode('fun');
                  setStep(AppStep.FUN_MODE_INPUT);
                }}
                className="group relative p-10 rounded-[2.5rem] border-2 border-white/10 bg-zinc-900/40 hover:border-netflix-red/50 hover:bg-zinc-800/80 transition-all duration-500 text-left hover:-translate-y-2 flex flex-col h-full shadow-2xl overflow-hidden"
              >
                <div className="absolute top-8 right-8 bg-zinc-950/80 border border-white/10 rounded-lg px-3 py-1.5 text-[10px] font-black tracking-[0.2em] text-zinc-400 group-hover:text-netflix-red transition-colors backdrop-blur-md">
                  ⏱️ ~30 SECONDS
                </div>
                <div className="relative mb-8">
                  <div className="text-7xl transform group-hover:scale-110 group-hover:-rotate-6 transition-transform duration-700 ease-out">
                    💖
                  </div>
                  <div className="absolute -top-2 -right-4 text-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100">🍿</div>
                  <div className="absolute bottom-0 -left-6 text-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-200">🎞️</div>
                </div>
                <h3 className="text-3xl font-black mb-4 tracking-tight">💖 Love Some Movies? Start There</h3>
                <p className="text-zinc-400 text-lg leading-relaxed mb-8 flex-grow">
                  Type 2–5 movies you love and we’ll decode your taste.
                </p>
                <div className="flex items-center text-netflix-red font-black uppercase tracking-widest text-[11px] group-hover:translate-x-3 transition-transform duration-300">
                  Match Favorites <span className="ml-2 text-lg">→</span>
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
            <p className="text-zinc-400 text-center mb-12 text-lg">Type 2–5 movies you love (any language, any genre).</p>
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
            <p className="text-zinc-400 text-center mb-12">You can pick more than one</p>
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
                className="bg-netflix-red disabled:opacity-50 disabled:cursor-not-allowed hover:bg-red-700 px-10 py-4 rounded-full font-bold text-xl transition-all shadow-lg active:scale-95"
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
            <h1 className="text-4xl md:text-5xl font-extrabold mb-4 text-center">Preferred Languages?</h1>
            <p className="text-zinc-400 text-center mb-12">We’ll prioritize these, not restrict strictly</p>
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
            <h1 className="text-4xl md:text-5xl font-extrabold mb-4 text-center">Which era are you in for?</h1>
            <p className="text-zinc-400 text-center mb-12">Multi-select available</p>
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
            <h1 className="text-4xl md:text-5xl font-extrabold mb-4 text-center">What’s on your mind?</h1>
            <p className="text-zinc-400 text-center mb-12">Magic happens through this text ✨</p>
            <textarea
              className="w-full h-40 bg-zinc-900 border-2 border-white/10 rounded-2xl p-6 text-xl focus:border-netflix-red outline-none transition-all placeholder:text-zinc-700 resize-none"
              placeholder="e.g. watching with parents, solo Sunday night, craving a smart Malayalam thriller..."
              value={prefs.magic_text}
              onChange={(e) => setPrefs({...prefs, magic_text: e.target.value})}
            />
            <div className="mt-12 flex justify-center">
              <button 
                onClick={handleGenerate}
                className="bg-netflix-red hover:bg-red-700 px-12 py-5 rounded-full font-bold text-2xl transition-all shadow-[0_0_30px_rgba(229,9,20,0.4)] active:scale-95"
              >
                Generate Recommendations
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

            {isLoading ? (
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
                            <div className="w-full h-full flex items-center justify-center">
                               <div className="w-full h-full bg-gradient-to-br from-zinc-800 to-zinc-900 animate-pulse flex items-center justify-center">
                                  <span className="text-zinc-700 text-6xl">🎬</span>
                               </div>
                            </div>
                          )}
                          
                          {meta?.rating && (
                            <div className="absolute top-4 right-4 bg-black/70 backdrop-blur-md px-3 py-1 rounded-lg border border-white/10 z-10">
                              <span className="text-yellow-400 font-bold text-sm">⭐ IMDb {meta.rating}</span>
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
                      className="bg-transparent border-2 border-white/20 text-white hover:bg-white hover:text-black px-12 py-4 rounded-full font-bold text-lg transition-all shadow-xl active:scale-95"
                    >
                      Load More
                    </button>
                  )}
                  <div className="flex flex-col items-center space-y-4 pt-10 border-t border-white/10 w-full max-w-lg">
                    <p className="text-zinc-500 font-medium tracking-wide uppercase text-xs">Want something different?</p>
                    <NewMoodButton label="Explore New Vibe" />
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-40">
                <div className="text-6xl mb-6">🍿</div>
                <h3 className="text-3xl font-bold mb-4">Uh-oh, looks like we don’t have recommendations for this mood</h3>
                <p className="text-zinc-500 mb-8">Try adjusting your picks or magic text.</p>
                <NewMoodButton label="Start Over" />
              </div>
            )}
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen custom-scrollbar selection:bg-netflix-red/30 overflow-x-hidden">
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
