import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { getDailyLiturgy, getReflection } from './services/geminiService';
import { LiturgyDay, ViewMode } from './types';
import { ChevronLeft, ChevronRight, BookOpen, Sparkles, Loader2, CalendarIcon } from './components/Icons';
import { AudioPlayer } from './components/AudioPlayer';

const COLORS = {
  green: "text-green-700 bg-green-50 border-green-100",
  red: "text-red-700 bg-red-50 border-red-100",
  white: "text-yellow-700 bg-yellow-50 border-yellow-100",
  purple: "text-purple-700 bg-purple-50 border-purple-100",
  rose: "text-pink-700 bg-pink-50 border-pink-100",
};

const BORDER_COLORS = {
  green: "border-green-600",
  red: "border-red-600",
  white: "border-yellow-500",
  purple: "border-purple-600",
  rose: "border-pink-500",
};

export default function App() {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [data, setData] = useState<LiturgyDay | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.READING);
  const [reflection, setReflection] = useState<string | null>(null);
  const [loadingReflection, setLoadingReflection] = useState<boolean>(false);

  useEffect(() => {
    fetchLiturgy(currentDate);
  }, [currentDate]);

  const fetchLiturgy = async (date: Date) => {
    setLoading(true);
    setError(null);
    setData(null);
    setReflection(null);
    
    // Format date for the prompt: "Lundi 14 Octobre 2024"
    const options: Intl.DateTimeFormatOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const dateStr = date.toLocaleDateString('fr-FR', options);

    try {
      const result = await getDailyLiturgy(dateStr);
      setData(result);
    } catch (err) {
      setError("Impossible de charger les lectures. Veuillez vérifier votre connexion.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleReflection = async () => {
    if (!data?.gospel?.text) return;
    setViewMode(ViewMode.REFLECTION);
    if (!reflection) {
      setLoadingReflection(true);
      try {
        const text = await getReflection(data.gospel.text);
        setReflection(text);
      } catch (e) {
        setReflection("Erreur lors de la génération de la méditation.");
      } finally {
        setLoadingReflection(false);
      }
    }
  };

  const changeDate = (days: number) => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + days);
    setCurrentDate(newDate);
  };

  const themeColor = data ? COLORS[data.liturgicalColor] || COLORS.green : COLORS.green;
  const borderTheme = data ? BORDER_COLORS[data.liturgicalColor] || BORDER_COLORS.green : BORDER_COLORS.green;

  const formatDateDisplay = (date: Date) => {
    return date.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });
  };

  return (
    <Layout
      header={
        <div className="flex items-center justify-between px-4 py-3 max-w-3xl mx-auto w-full">
          <button onClick={() => changeDate(-1)} className="p-2 rounded-full hover:bg-gray-100 text-gray-600">
            <ChevronLeft />
          </button>
          
          <div className="flex flex-col items-center">
            <span className="text-sm font-semibold uppercase tracking-widest text-gray-500">
              {formatDateDisplay(currentDate)}
            </span>
            {data && (
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full mt-1 ${themeColor}`}>
                {data.liturgicalColor === 'green' ? 'Temps Ordinaire' : 
                 data.liturgicalColor === 'purple' ? 'Carême / Avent' :
                 data.liturgicalColor === 'white' ? 'Fête / Solennité' :
                 data.liturgicalColor === 'red' ? 'Martyr / Esprit Saint' : 'Liturgie'}
              </span>
            )}
          </div>

          <button onClick={() => changeDate(1)} className="p-2 rounded-full hover:bg-gray-100 text-gray-600">
            <ChevronRight />
          </button>
        </div>
      }
      bottomNav={
        <div className="bg-white/90 backdrop-blur border-t border-gray-200 px-6 py-4 flex justify-around shadow-2xl safe-area-bottom">
          <button 
            onClick={() => setViewMode(ViewMode.READING)}
            className={`flex flex-col items-center space-y-1 ${viewMode === ViewMode.READING ? 'text-gray-900' : 'text-gray-400'}`}
          >
            <BookOpen className={viewMode === ViewMode.READING ? "stroke-2" : "stroke-1"} />
            <span className="text-[10px] font-medium uppercase tracking-wide">Lectures</span>
          </button>

          {/* Center Action Button (Play) */}
          <div className="-mt-8">
             {data?.gospel && !loading ? (
                <AudioPlayer textToRead={`Évangile de Jésus Christ selon ${data.gospel.reference}. ${data.gospel.text}`} />
             ) : (
               <div className="w-12 h-12 rounded-full bg-gray-200" />
             )}
          </div>

          <button 
            onClick={handleReflection}
            className={`flex flex-col items-center space-y-1 ${viewMode === ViewMode.REFLECTION ? 'text-gray-900' : 'text-gray-400'}`}
          >
            <Sparkles className={viewMode === ViewMode.REFLECTION ? "stroke-2" : "stroke-1"} />
            <span className="text-[10px] font-medium uppercase tracking-wide">Méditer</span>
          </button>
        </div>
      }
    >
      {loading ? (
        <div className="flex flex-col items-center justify-center h-64 space-y-4">
          <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
          <p className="text-gray-400 font-serif italic">Préparation de la liturgie...</p>
        </div>
      ) : error ? (
        <div className="text-center p-8 bg-red-50 rounded-xl text-red-600">
          <p>{error}</p>
          <button onClick={() => fetchLiturgy(currentDate)} className="mt-4 px-4 py-2 bg-white border border-red-200 rounded shadow-sm">Réessayer</button>
        </div>
      ) : data ? (
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
          
          {/* Header Title */}
          <div className="text-center space-y-2">
            <h1 className="text-2xl md:text-3xl font-serif font-bold text-gray-900 leading-tight">
              {data.liturgicalDayName}
            </h1>
            <div className="w-16 h-1 mx-auto bg-gray-200 rounded-full mt-4"></div>
          </div>

          {viewMode === ViewMode.READING && (
            <>
              {/* Gospel Section (Highlighted) */}
              <section className="relative">
                 <div className={`absolute -left-4 top-0 bottom-0 w-1 ${borderTheme} opacity-50 hidden md:block`}></div>
                 <div className="space-y-4">
                    <header className="flex flex-col md:flex-row md:items-baseline md:justify-between gap-2">
                       <h2 className="text-xs font-bold tracking-widest uppercase text-gray-500">Évangile</h2>
                       <span className="font-serif italic text-gray-600">{data.gospel.reference}</span>
                    </header>
                    <div className="prose prose-lg prose-gray max-w-none">
                      <h3 className="font-serif text-xl font-medium text-gray-900 mb-6">
                        {data.gospel.title}
                      </h3>
                      {data.gospel.text.split('\n').map((paragraph, idx) => (
                        <p key={idx} className="font-serif text-lg leading-relaxed text-gray-800 mb-4">
                          {paragraph}
                        </p>
                      ))}
                    </div>
                    <div className="flex justify-center mt-8">
                       <span className="text-xs uppercase tracking-widest text-gray-400">Acclamons la Parole de Dieu</span>
                    </div>
                 </div>
              </section>

              {/* Other Readings (Collapsible or just listed below less prominently) */}
              <div className="border-t border-gray-100 pt-12 space-y-12 opacity-80">
                 {data.firstReading && (
                    <section className="space-y-3">
                       <h2 className="text-xs font-bold tracking-widest uppercase text-gray-400">Première Lecture</h2>
                       <div className="font-serif text-gray-600">
                          <p className="font-medium mb-2">{data.firstReading.reference}</p>
                          <p className="leading-relaxed">{data.firstReading.text.substring(0, 150)}...</p>
                          <button onClick={() => alert("Version complète disponible dans une future mise à jour")} className="text-xs text-blue-600 mt-2 hover:underline">Lire la suite</button>
                       </div>
                    </section>
                 )}
                 
                 {data.psalm && (
                    <section className="space-y-3">
                        <h2 className="text-xs font-bold tracking-widest uppercase text-gray-400">Psaume</h2>
                         <div className="font-serif text-gray-600 italic pl-4 border-l-2 border-gray-100">
                           {data.psalm.text.split('\n').slice(0, 4).map((line, i) => (
                             <p key={i}>{line}</p>
                           ))}
                         </div>
                    </section>
                 )}
              </div>
            </>
          )}

          {viewMode === ViewMode.REFLECTION && (
            <div className="min-h-[50vh]">
              <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100">
                 <div className="flex items-center space-x-2 mb-6 text-purple-600">
                    <Sparkles className="w-5 h-5" />
                    <h2 className="text-sm font-bold uppercase tracking-widest">Méditation du jour</h2>
                 </div>
                 
                 {loadingReflection ? (
                   <div className="space-y-4 animate-pulse">
                      <div className="h-4 bg-gray-100 rounded w-3/4"></div>
                      <div className="h-4 bg-gray-100 rounded w-full"></div>
                      <div className="h-4 bg-gray-100 rounded w-5/6"></div>
                      <div className="h-4 bg-gray-100 rounded w-2/3"></div>
                   </div>
                 ) : (
                   <div className="prose prose-purple">
                     {reflection?.split('\n').map((p, i) => (
                       <p key={i} className="font-serif text-lg leading-relaxed text-gray-700 mb-4">
                         {p}
                       </p>
                     ))}
                   </div>
                 )}
              </div>
            </div>
          )}

        </div>
      ) : null}
    </Layout>
  );
}
