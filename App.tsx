
import React, { useState } from 'react';
import { BIBLE_BOOKS, BIBLE_THEMES, BIBLE_CHARACTERS } from './constants';
import { generateQuizData } from './geminiService';
import { QuizItem } from './types';
import pptxgen from "pptxgenjs";

type Category = 'bible' | 'theme' | 'character';

const App: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [category, setCategory] = useState<Category>('bible');
  const [subject, setSubject] = useState(BIBLE_BOOKS[0]);
  const [customSubject, setCustomSubject] = useState('');
  const [quizCount, setQuizCount] = useState(10);
  const [quizItems, setQuizItems] = useState<QuizItem[]>([]);
  const [revealedIndices, setRevealedIndices] = useState<Set<number>>(new Set());
  const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const getOptions = () => {
    switch (category) {
      case 'bible': return BIBLE_BOOKS;
      case 'theme': return BIBLE_THEMES;
      case 'character': return BIBLE_CHARACTERS;
      default: return [];
    }
  };

  const handleCategoryChange = (newCat: Category) => {
    setCategory(newCat);
    const options = newCat === 'bible' ? BIBLE_BOOKS : (newCat === 'theme' ? BIBLE_THEMES : BIBLE_CHARACTERS);
    setSubject(options[0]);
    setCustomSubject('');
  };

  const handleGenerate = async () => {
    setLoading(true);
    setQuizItems([]);
    setRevealedIndices(new Set());
    setFeedback(null);

    try {
      const finalSubject = customSubject || subject;
      const data = await generateQuizData(finalSubject, quizCount, category);
      setQuizItems(data.items);
      setFeedback({ message: `"${finalSubject}" 관련 ${quizCount}개의 퀴즈가 준비되었습니다!`, type: 'info' });
    } catch (err: any) {
      setFeedback({ message: err.message || '오류가 발생했습니다.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const toggleReveal = (index: number) => {
    const newRevealed = new Set(revealedIndices);
    if (newRevealed.has(index)) {
      newRevealed.delete(index);
    } else {
      newRevealed.add(index);
    }
    setRevealedIndices(newRevealed);
  };

  const revealAll = () => {
    const all = new Set(quizItems.map((_, i) => i));
    setRevealedIndices(all);
    setFeedback({ message: "모든 정답이 공개되었습니다.", type: 'info' });
  };

  const exportToPptx = async () => {
    if (quizItems.length === 0) return;
    setExporting(true);
    const finalSubject = customSubject || subject;
    
    const pres = new pptxgen();
    pres.layout = 'LAYOUT_WIDE';
    
    // Title Slide
    let slide = pres.addSlide();
    slide.background = { fill: "F5F5F4" }; // stone-100
    slide.addText("성경초성퀴즈", {
      x: 0, y: "35%", w: "100%", align: "center", fontSize: 60, bold: true, color: "78350F", fontFace: "Malgun Gothic"
    });
    slide.addText(`주제: ${finalSubject} (${quizItems.length}문항)`, {
      x: 0, y: "55%", w: "100%", align: "center", fontSize: 30, color: "444444", fontFace: "Malgun Gothic"
    });

    // Content Slides
    quizItems.forEach((item, index) => {
      // 1. Question Slide
      let qSlide = pres.addSlide();
      qSlide.background = { fill: "FFFFFF" };
      
      // Question Number
      qSlide.addText(`Q${index + 1}.`, {
        x: 0.5, y: 0.5, w: 2, fontSize: 40, bold: true, color: "78350F"
      });

      // Initials
      qSlide.addText(item.initials, {
        x: 0, y: "30%", w: "100%", align: "center", fontSize: 90, bold: true, color: "111111", charSpacing: 20
      });

      // Clue
      qSlide.addText(item.clue, {
        x: "10%", y: "60%", w: "80%", align: "center", fontSize: 24, color: "666666", fontFace: "Malgun Gothic"
      });

      // 2. Answer Slide
      let aSlide = pres.addSlide();
      aSlide.background = { fill: "F0FDF4" }; // green-50

      aSlide.addText(`Q${index + 1} 정답`, {
        x: 0.5, y: 0.5, w: 3, fontSize: 30, bold: true, color: "166534"
      });

      aSlide.addText(item.word, {
        x: 0, y: "40%", w: "100%", align: "center", fontSize: 100, bold: true, color: "166534", fontFace: "Malgun Gothic"
      });
    });

    try {
      await pres.writeFile({ fileName: `성경초성퀴즈_${finalSubject}.pptx` });
      setFeedback({ message: "PPT 파일 다운로드가 시작되었습니다!", type: 'success' });
    } catch (err) {
      setFeedback({ message: "PPT 생성 중 오류가 발생했습니다.", type: 'error' });
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-100 text-stone-900 pb-20 selection:bg-amber-200">
      {/* Header */}
      <header className="bg-gradient-to-br from-amber-800 via-amber-900 to-stone-950 text-amber-50 py-16 px-4 shadow-2xl text-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-5 pointer-events-none">
          <svg width="100%" height="100%"><pattern id="dots" width="20" height="20" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1" fill="currentColor"/></pattern><rect width="100%" height="100%" fill="url(#dots)" /></svg>
        </div>
        <h1 className="text-5xl md:text-7xl font-black serif-font mb-4 relative drop-shadow-2xl tracking-tighter italic">📖 성경초성퀴즈</h1>
        <p className="text-xl md:text-2xl opacity-80 font-light serif-font max-w-2xl mx-auto border-t border-amber-50/20 pt-6">
          성경의 지혜를 초성으로 풀어보는 묵상 퀴즈
        </p>
      </header>

      {/* Category Tabs */}
      <div className="max-w-5xl mx-auto mt-6 px-4 flex justify-center gap-2 md:gap-4">
        {[
          { id: 'bible', label: '✝️ 성경' },
          { id: 'theme', label: '📜 주제' },
          { id: 'character', label: '👤 인물' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => handleCategoryChange(tab.id as Category)}
            className={`flex-1 max-w-[150px] py-4 rounded-t-3xl font-black text-lg transition-all shadow-md ${
              category === tab.id ? 'bg-white text-amber-900 border-b-0 translate-y-1' : 'bg-stone-200 text-stone-500 hover:bg-stone-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Control Panel */}
      <section className="max-w-5xl mx-auto p-8 md:p-10 bg-white rounded-b-[3rem] rounded-tr-[3rem] shadow-2xl border border-stone-200 relative z-10 mx-4 lg:mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-end">
          <div className="md:col-span-4">
            <label className="block text-xs font-black text-amber-900 mb-3 uppercase tracking-[0.2em] ml-2">목록 선택</label>
            <select 
              value={subject} 
              onChange={(e) => { setSubject(e.target.value); setCustomSubject(''); }}
              className="w-full p-5 bg-stone-50 border-2 border-stone-100 rounded-2xl focus:border-amber-700 focus:ring-8 focus:ring-amber-700/5 outline-none transition-all cursor-pointer font-bold text-xl shadow-inner"
            >
              {getOptions().map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
          </div>
          <div className="md:col-span-4">
            <label className="block text-xs font-black text-amber-900 mb-3 uppercase tracking-[0.2em] ml-2">그 외 주제/인물 입력</label>
            <input 
              type="text" 
              placeholder="직접 입력 시 최우선 적용..." 
              value={customSubject}
              onChange={(e) => setCustomSubject(e.target.value)}
              className="w-full p-5 bg-stone-50 border-2 border-stone-100 rounded-2xl focus:border-amber-700 focus:ring-8 focus:ring-amber-700/5 outline-none transition-all font-bold text-xl shadow-inner"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-black text-amber-900 mb-3 uppercase tracking-[0.2em] ml-2">문항수</label>
            <select 
              value={quizCount}
              onChange={(e) => setQuizCount(Number(e.target.value))}
              className="w-full p-5 bg-stone-50 border-2 border-stone-100 rounded-2xl focus:border-amber-700 focus:ring-8 focus:ring-amber-700/5 outline-none transition-all cursor-pointer font-bold text-xl shadow-inner"
            >
              {[10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map(c => <option key={c} value={c}>{c}개</option>)}
            </select>
          </div>
          <div className="md:col-span-2">
            <button 
              onClick={handleGenerate}
              disabled={loading}
              className="w-full bg-amber-800 hover:bg-amber-700 text-white font-black py-5 px-4 rounded-2xl transition-all shadow-xl active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 text-xl"
            >
              {loading ? (
                <div className="animate-spin h-6 w-6 border-4 border-white border-t-transparent rounded-full"></div>
              ) : (
                "퀴즈 생성 🚀"
              )}
            </button>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto mt-16 px-4">
        {feedback && (
          <div className={`mb-12 p-6 rounded-3xl text-center font-black text-xl shadow-lg border-2 animate-bounce ${
            feedback.type === 'success' ? 'bg-green-100 text-green-900 border-green-200' : 
            feedback.type === 'error' ? 'bg-red-100 text-red-900 border-red-200' : 
            'bg-amber-100 text-amber-900 border-amber-200'
          }`}>
            {feedback.message}
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 space-y-8">
            <div className="relative h-24 w-24">
              <div className="absolute inset-0 rounded-full border-8 border-amber-100 opacity-50"></div>
              <div className="absolute inset-0 rounded-full border-8 border-amber-800 border-t-transparent animate-spin"></div>
            </div>
            <h2 className="text-3xl font-black text-stone-700 serif-font">성경 말씀을 갈무리하는 중...</h2>
          </div>
        ) : quizItems.length > 0 ? (
          <div className="space-y-8">
            {quizItems.map((item, idx) => (
              <div 
                key={idx} 
                className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-stone-100 flex flex-col lg:flex-row items-center gap-10 transition-all hover:shadow-2xl"
              >
                <div className="flex-shrink-0 flex items-center justify-center w-16 h-16 bg-amber-900 text-amber-50 rounded-3xl font-black text-2xl shadow-lg transform -rotate-3">
                  {idx + 1}
                </div>
                
                <div className="flex-grow text-center lg:text-left">
                  <div className="flex flex-col lg:flex-row lg:items-center gap-4 mb-4">
                    <span className="text-sm font-black text-amber-800 uppercase tracking-widest bg-amber-50 px-4 py-1.5 rounded-full border border-amber-100 inline-block w-fit mx-auto lg:mx-0">초성 힌트</span>
                    <span className="text-5xl font-black text-stone-900 tracking-[0.4em] serif-font">{item.initials}</span>
                  </div>
                  <p className="text-stone-600 font-bold text-xl leading-relaxed max-w-2xl">{item.clue}</p>
                </div>

                <div className="w-full lg:w-72 perspective-1000">
                  <div 
                    className={`relative w-full h-24 transition-all duration-1000 preserve-3d cursor-pointer ${revealedIndices.has(idx) ? 'revealed-animation' : 'hidden-animation'}`}
                    onClick={() => toggleReveal(idx)}
                  >
                    {/* Front: Check Button */}
                    <div className="absolute inset-0 backface-hidden flex items-center justify-center bg-amber-800 hover:bg-amber-700 text-white rounded-3xl font-black text-xl shadow-xl border-4 border-amber-900/10 transition-colors">
                      <span className="flex items-center gap-2">정답 확인하기 <span className="text-2xl">🔍</span></span>
                    </div>
                    
                    {/* Back: The Answer */}
                    <div className="absolute inset-0 backface-hidden rotate-y-180 flex items-center justify-center bg-green-50 border-4 border-green-500 text-green-900 rounded-3xl font-black text-3xl shadow-inner">
                      {item.word}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            <div className="flex flex-wrap justify-center gap-6 mt-20">
              <button 
                onClick={exportToPptx}
                disabled={exporting}
                className="bg-orange-600 hover:bg-orange-700 text-white px-12 py-6 rounded-[2rem] font-black shadow-2xl transition-all active:scale-95 text-2xl flex items-center gap-4"
              >
                {exporting ? (
                  <div className="animate-spin h-6 w-6 border-4 border-white border-t-transparent rounded-full"></div>
                ) : "📊 PPT 파일로 저장"}
              </button>
              <button 
                onClick={revealAll}
                className="bg-stone-900 hover:bg-black text-white px-12 py-6 rounded-[2rem] font-black shadow-2xl transition-all active:scale-95 text-2xl flex items-center gap-4"
              >
                💡 모든 정답 공개
              </button>
              <button 
                onClick={handleGenerate}
                className="bg-amber-800 hover:bg-amber-700 text-white px-12 py-6 rounded-[2rem] font-black shadow-2xl transition-all active:scale-95 text-2xl flex items-center gap-4"
              >
                🔄 새로운 퀴즈
              </button>
            </div>
          </div>
        ) : (
          <div className="py-32 text-center opacity-40 grayscale">
            <div className="text-9xl mb-8">📜</div>
            <h2 className="text-3xl font-black serif-font text-stone-800">성경 카테고리를 선택하고<br/>퀴즈를 생성해 보세요.</h2>
          </div>
        )}
      </main>

      <footer className="mt-32 border-t-8 border-stone-200 py-20 text-center text-stone-500 font-bold bg-stone-50">
        <div className="max-w-3xl mx-auto px-6">
          <p className="text-3xl serif-font mb-6 leading-relaxed">"풀은 마르고 꽃은 시드나 우리 하나님의 말씀은 영원히 서리라 하라"</p>
          <p className="opacity-40 text-lg uppercase tracking-widest">이사야 40:8 • 성경초성퀴즈 마스터</p>
        </div>
      </footer>

      <style>{`
        .perspective-1000 { perspective: 1000px; }
        .preserve-3d { transform-style: preserve-3d; }
        .backface-hidden { backface-visibility: hidden; }
        .rotate-y-180 { transform: rotateY(180deg); }
        
        .revealed-animation {
          animation: spin-to-reveal 1.2s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }

        .hidden-animation {
          animation: spin-to-hide 0.8s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }

        @keyframes spin-to-reveal {
          from { transform: rotateY(0deg); }
          to { transform: rotateY(900deg); } 
        }

        @keyframes spin-to-hide {
          from { transform: rotateY(900deg); }
          to { transform: rotateY(0deg); }
        }
      `}</style>
    </div>
  );
};

export default App;